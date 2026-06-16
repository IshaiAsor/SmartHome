-- Create sensor_history.
-- This model existed in schema.prisma (applied to local dev via `db push`) but was never
-- captured in a migration, so `migrate deploy` never created it on staging/prod. The
-- deployed digest-service writes every camera frame to sensor_history, so the gap caused
-- silent insert failures; the following widen_sensor_history_value migration also failed
-- because it ALTERed a table that did not exist.
--
-- value is created as TEXT here, so 20260616000000_widen_sensor_history_value becomes a no-op.

CREATE TABLE "sensor_history" (
  "id"                    SERIAL PRIMARY KEY,
  "user_device_action_id" INTEGER NOT NULL,
  "value"                 TEXT NOT NULL,
  "recorded_at"           TIMESTAMP(6) NOT NULL DEFAULT NOW(),
  CONSTRAINT "sensor_history_uda_fkey"
    FOREIGN KEY ("user_device_action_id") REFERENCES "user_device_actions"("id") ON DELETE CASCADE
);

CREATE INDEX "sensor_history_uda_recorded_at_idx"
  ON "sensor_history" ("user_device_action_id", "recorded_at");
