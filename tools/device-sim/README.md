# device-sim (`@lattice/device-sim`)

Software ESP device simulator. **Pure HTTP + MQTT (+ camera WS/HTTP)** — the same surface a real
ESP touches, with no DB shortcut — so it can both run as a CLI and be imported as a fixture for
automated tests. It provisions, **pulls its configuration** from the device-gateway config endpoint
(mirroring firmware `DynamicDeviceActionsService::loadFromServer`), and drives telemetry/commands
from *that* — i.e. only the capabilities a user activated in the UI.

See [PARITY.md](PARITY.md) for the firmware↔sim feature matrix — what's mirrored, partial, or
intentionally not simulated. Keep it updated when firmware behavior changes.

## Prereqs
- `docker compose up -d` (EMQX 1883, postgres, redis/valkey, rabbitmq)
- Migrate + seed + catalog (runs `prisma migrate deploy && prisma db seed && seed-catalog.ts`):
  `docker compose run --rm migrate`. Set `OWNER_USERNAME`/`OWNER_PASSWORD` in `.env` first — the
  seed creates a login-able admin **only** when both are set (that's the account the sim/tests use).
- New services running (VS Code **All Backend Services (dev)** incl. **Debug API** on 3100):
  api, device-gateway, mqtt-service, digest-service, socket-server (+ automation-worker for rules)
- `npm install` at the repo root (installs the sim's `mqtt`/`ws` deps via the workspace)

## Run (CLI)
```bash
node tools/device-sim/index.js          # or: npm start -w @lattice/device-sim
```
Or use the **Run Device Sim** VS Code launch config (after the backend compound is up).

Then open the backoffice (`ng serve`, log in admin/admin): the device shows **online**, action
cards populate, scalar telemetry updates live, toggling a command action acks back (the card leaves
its pending state because the sim echoes the `commandId`), and a threshold rule fires when a
reading crosses it. `Ctrl-C` stops (publishes offline).

By default `ACTIVATE_ALL=true` activates every catalog capability through the **real api**
(`POST /api/devices/:id/actions`) so a fresh device has something to drive. Set `ACTIVATE_ALL=false`
to instead drive **only** what you activate by hand in the device-config UI — the sim re-pulls its
config every `CONFIG_REFRESH_MS`, so activations/deactivations take effect live without a restart.

For camera, run a camera device type, e.g. `DEVICE_TYPE=ESP32S3_CAM node tools/device-sim/index.js`.

## Control commands (resets + OTA)
The sim honours the same control commands the firmware does
([MqttActionsHandlerService](../../ESP32Code/src/services/MqttActionsHandlerService.h)):

| trigger | sim behavior |
|---|---|
| `restart` | offline → drop MQTT → reconnect (creds kept) → re-pull config |
| `soft-reset` / `reprovision` | offline → re-provision (fresh device JWT) → reconnect → re-pull |
| `hard-reset` | offline → disconnect → emit `hard-reset` (CLI exits) |
| OTA on `ota/updates/<type>` | if strictly newer: ack `starting:<v>`, adopt the version, "reboot", reconnect on the **new** version topic (UI's `current_firmware_version` updates); if not newer: ack `rejected:not-newer`; with `OTA_FAIL=true`: ack `failed:` and stay |

Like firmware, the reset/restart commands are **not** acked (the device reboots instead).

## Env overrides
`API_URL`, `GATEWAY_URL`, `MQTT_HOST`, `MQTT_PORT`, `SIM_USER`/`SIM_PASS`, `DEVICE_TYPE`
(ESP32S3_MINI/CAM/WROVER/GEN4_GENERIC), `MAC`, `TELEMETRY_MS`, `CAMERA_MS`, `CONFIG_REFRESH_MS`,
`CONFIG_REFRESH_MS` (periodic config re-pull; default 60000, `0` disables — real firmware only
pulls at boot), `ACTIVATE_ALL=false`, `CAMERA=false`, `RESTART_ON_LOSS=true` (mimic ESP.restart on disconnect),
`OTA_FAIL=true`, `PERSIST=false` (skip the on-disk NVS state file), `CLEANUP_ON_EXIT=true`.

## Library API (for tests / scripting)
```js
const { SimDevice } = require('@lattice/device-sim');           // or require('../tools/device-sim/lib/sim-device')
const dev = new SimDevice({ deviceType: 'ESP32S3_CAM', persist: false, autoTelemetry: false, log: console.log });
await dev.start();                                              // login→catalog→provision→activate→pullConfig→connect
dev.publishTelemetry('humidity', 42);
const ack = await dev.waitFor('ack', (a) => a.commandId === id, 5000);  // awaitable event hook
await dev.cleanup();                                           // disconnect + delete the device via the api
```
Key methods: `start()`, `login()`, `loadCatalog()`, `provision()`, `activateAll()`, `pullConfig()`,
`connect()`, `publishTelemetry(name, value)`, `publishStatus(s)`, `refreshTokenNow()`,
`reboot({reprovision})`, `stop()`, `cleanup()`, `waitFor(event, predicate?, timeoutMs)`.
Events: `connect, config, command, ack, telemetry, camera-frame, ota, reboot, refresh, offline,
hard-reset, error`. All config is via constructor `opts` (no env reads); see `DEFAULTS` in
[lib/sim-device.js](lib/sim-device.js).

## Automated tests
The repo root runs **Jest** (`jest.config.js`):
- `npm test` — everything (unit + e2e). Unit tests (e.g. `tests/unit/command-models.test.js`) run
  anywhere; e2e tests **skip cleanly** when the stack is down.
- `npm run test:e2e` — the stack-driven suite (`tests/e2e/device-sim.e2e.test.ts`) using `SimDevice`
  as the fixture: provision→online, telemetry→state, valid/invalid command acks, duration auto-off.
  Command round-trips need the app MQTT creds (`MQTT_APP_USERNAME`/`MQTT_APP_PASSWORD`, loaded from
  the root `.env`); those cases skip if absent. Helpers live in `tests/e2e/helpers/stack.ts`.

## What it does (CLI flow)
1. `POST /api/auth/login` → app JWT
2. `GET /api/admin/catalog/devices` + `…/:id/capabilities` → the device type's blueprint
3. `GET /api/provisioning/provision-token` → provisioning token
4. `POST /api/provisioning/provision` → `{deviceId, mqttToken, deviceConfigUrl, refreshToken, …}`
5. (if `ACTIVATE_ALL`) activate not-yet-configured capabilities via `POST /api/devices/:id/actions`
6. **`GET {deviceConfigUrl}?deviceId&version`** (device JWT) → the device's *active* actions
7. MQTT connect; subscribe `…/command/#` + `ota/updates/<type>`; publish `status=online` (LWT offline)
8. drive telemetry per action interval; camera frames over WS/HTTP; per-type command validation +
   ack (echoing `commandId`); duration auto-off; NVS-style state restore; token refresh near expiry;
   resets + OTA per the table above
