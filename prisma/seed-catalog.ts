// Populates the master device catalog (devices + device_capability_blueprints) from the
// firmware-generated manifests in ESP32Code/tools/manifest-gen/out/*.json.
//
// This is the build-driven replacement for the old device-driven catalog write: the
// manifest comes from firmware SOURCE (via the host generator), not from a live device
// provisioning itself. Locally the catalog is freely re-seeded; in prod the same JSON is
// ingested through an authenticated CI path (kept append-only there).
//
//   node tools/generate-manifests.mjs   (in ESP32Code/, writes the JSON)
//   npm run catalog:seed                 (runs the generator, then this script)
import pg from 'pg';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { config as dotenvConfig } from 'dotenv';

// ts-node runs this in CommonJS mode (no "type":"module"), so __dirname is available.
// Load root .env so DATABASE_URL is available when running via plain ts-node (not prisma db seed).
dotenvConfig({ path: join(__dirname, '..', '.env') });

const manifestDir = join(__dirname, '..', 'ESP32Code', 'tools', 'manifest-gen', 'out');

interface CapabilityManifestEntry {
  capability_key: string;
  label: string;
  implementation_type: string;
  mqtt_action_type: string;
  mqtt_action_name: string;
  google_action_type: string | null;
  min_telemetry_interval_ms: number | null;
  google_traits: string[];
  configurable_pins: { key: string; label: string; mode: string }[];
}

interface DeviceManifest {
  deviceType: string;
  version: string;
  capabilities: CapabilityManifestEntry[];
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

function loadManifests(): DeviceManifest[] {
  if (!existsSync(manifestDir)) {
    throw new Error(
      `No manifests at ${manifestDir}. Run: (cd ESP32Code && node tools/generate-manifests.mjs)`,
    );
  }
  const files = readdirSync(manifestDir).filter((f) => f.endsWith('.json'));
  if (files.length === 0) throw new Error(`No *.json manifests in ${manifestDir}. Run the generator first.`);
  return files.map((f) => JSON.parse(readFileSync(join(manifestDir, f), 'utf8')) as DeviceManifest);
}

async function seedManifest(m: DeviceManifest) {
  // 1. Upsert the device type (catalog identity).
  const deviceRes = await pool.query<{ id: number }>(
    `INSERT INTO devices (type, version, default_name)
     VALUES ($1, $2, $3)
     ON CONFLICT (type, version) DO UPDATE SET updated_at = now()
     RETURNING id`,
    [m.deviceType, m.version, `${m.deviceType} ${m.version}`],
  );
  const deviceId = deviceRes.rows[0].id;

  // 2. Upsert each capability blueprint declared by the firmware.
  for (const c of m.capabilities) {
    await pool.query(
      `INSERT INTO device_capability_blueprints
         (device_id, capability_key, label, implementation_type, mqtt_action_type,
          mqtt_action_name, configurable_pins, min_telemetry_interval_ms,
          google_action_type, google_traits)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (device_id, capability_key) DO UPDATE SET
         label = EXCLUDED.label,
         implementation_type = EXCLUDED.implementation_type,
         mqtt_action_type = EXCLUDED.mqtt_action_type,
         mqtt_action_name = EXCLUDED.mqtt_action_name,
         configurable_pins = EXCLUDED.configurable_pins,
         min_telemetry_interval_ms = EXCLUDED.min_telemetry_interval_ms,
         google_action_type = EXCLUDED.google_action_type,
         google_traits = EXCLUDED.google_traits`,
      [
        deviceId,
        c.capability_key,
        c.label,
        c.implementation_type,
        c.mqtt_action_type,
        c.mqtt_action_name,
        JSON.stringify(c.configurable_pins ?? []),
        c.min_telemetry_interval_ms ?? null,
        c.google_action_type ?? null,
        c.google_traits == null ? null : JSON.stringify(c.google_traits),
      ],
    );
  }
  console.log(`🌱 catalog: ${m.deviceType} ${m.version} — ${m.capabilities.length} capabilities`);
}

async function main() {
  const manifests = loadManifests();
  for (const m of manifests) await seedManifest(m);
  console.log(`✅ seeded ${manifests.length} device-type manifest(s)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => pool.end());
