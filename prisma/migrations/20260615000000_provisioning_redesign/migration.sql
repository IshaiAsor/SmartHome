-- Make devices.type and devices.version non-nullable
UPDATE "devices" SET "type" = '' WHERE "type" IS NULL;
UPDATE "devices" SET "version" = '' WHERE "version" IS NULL;
ALTER TABLE "devices" ALTER COLUMN "type" SET NOT NULL;
ALTER TABLE "devices" ALTER COLUMN "version" SET NOT NULL;

-- Add unique constraint on (type, version) for upsert support
ALTER TABLE "devices" ADD CONSTRAINT "devices_type_version_key" UNIQUE ("type", "version");

-- Create device_capability_blueprints table
CREATE TABLE "device_capability_blueprints" (
    "id"                    SERIAL PRIMARY KEY,
    "device_id"             INTEGER NOT NULL,
    "capability_key"        VARCHAR(64) NOT NULL,
    "label"                 VARCHAR(255) NOT NULL,
    "implementation_type"   VARCHAR(64) NOT NULL,
    "mqtt_action_type"      VARCHAR(32) NOT NULL,
    "mqtt_action_name"      VARCHAR(64) NOT NULL,
    "configurable_pins"     JSONB,
    "telemetry_interval_ms" INTEGER,
    "created_at"            TIMESTAMP DEFAULT NOW(),
    CONSTRAINT "device_capability_blueprints_device_id_fkey"
        FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE CASCADE,
    CONSTRAINT "device_capability_blueprints_device_id_capability_key_key"
        UNIQUE ("device_id", "capability_key")
);

