#!/usr/bin/env node
// CLI wrapper around the SimDevice library (lib/sim-device.js). Reads config from env, wires the
// device's events to console output, and handles Ctrl-C. The device logic itself lives in the
// library so it can also be imported by automated tests. See README.md and PARITY.md.
//
//   node tools/device-sim/index.js
//
// Env (defaults): API_URL=http://localhost:3100  GATEWAY_URL=http://localhost:3004
//   MQTT_HOST=127.0.0.1  MQTT_PORT=1883  SIM_USER=admin  SIM_PASS=admin
//   DEVICE_TYPE=ESP32S3_MINI  MAC=SIM-AA:BB:CC:DD:EE:01  TELEMETRY_MS=5000  CAMERA_MS=2000
//   CONFIG_REFRESH_MS=60000 (0 disables)  ACTIVATE_ALL=true  CAMERA=true  RESTART_ON_LOSS=false
//   OTA_FAIL=false  PERSIST=true  CLEANUP_ON_EXIT=false

const { SimDevice } = require('./lib/sim-device');

const num = (v, d) => (v === undefined ? d : parseInt(v, 10));
const bool = (v, d) => (v === undefined ? d : v !== 'false');

const dev = new SimDevice({
  apiUrl:          process.env.API_URL,
  gatewayUrl:      process.env.DEVICE_GATEWAY_URL,
  mqttHost:        process.env.MQTT_SERVER_NAME,
  mqttPort:        num(process.env.MQTT_PORT, undefined),
  // Default to the seeded owner (OWNER_USERNAME/OWNER_PASSWORD) so the sim logs in as the exact
  // credential admin the seed created; SIM_USER/SIM_PASS override, then a last-resort admin/admin.
  user:            process.env.SIM_USER || process.env.OWNER_USERNAME || 'admin',
  pass:            process.env.SIM_PASS || process.env.OWNER_PASSWORD || 'admin',
  deviceType:      process.env.DEVICE_TYPE || 'ESP32S3_MINI',
  mac:             process.env.MAC || 'SIM-AA:BB:CC:DD:EE:01',
  telemetryMs:     num(process.env.TELEMETRY_MS, undefined),
  cameraMs:        num(process.env.CAMERA_MS, undefined),
  configRefreshMs: num(process.env.CONFIG_REFRESH_MS, undefined),
  activateAll:     bool(process.env.ACTIVATE_ALL, undefined),
  camera:          bool(process.env.CAMERA, undefined),
  restartOnLoss:   bool(process.env.RESTART_ON_LOSS, undefined),
  otaFail:         bool(process.env.OTA_FAIL, undefined),
  persist:         bool(process.env.PERSIST, undefined),
  log:             console.log,
});

// Strip undefined so the library defaults apply.
for (const k of Object.keys(dev.opts)) if (dev.opts[k] === undefined) delete dev.opts[k];

const CLEANUP_ON_EXIT = process.env.CLEANUP_ON_EXIT === 'true';

dev.on('error', (e) => console.error('✗', e.message || e));
dev.on('hard-reset', async () => {
  console.log('hard-reset complete — exiting (re-run the sim to re-onboard)');
  process.exit(0);
});

const shutdown = async () => {
  if (CLEANUP_ON_EXIT) { await dev.cleanup(); console.log('cleaned up device'); }
  else await dev.stop();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

dev.start().catch((e) => { console.error('✗', e.message || e); process.exit(1); });
