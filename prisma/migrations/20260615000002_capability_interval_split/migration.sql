-- Rename blueprint column: device-declared minimum becomes explicit
ALTER TABLE "device_capability_blueprints"
  RENAME COLUMN "telemetry_interval_ms" TO "min_telemetry_interval_ms";

-- Add user-configured interval to user_device_actions (null = use blueprint minimum)
ALTER TABLE "user_device_actions"
  ADD COLUMN "telemetry_interval_ms" INT;
