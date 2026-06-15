ALTER TABLE "device_capability_blueprints"
  ADD COLUMN "google_action_type" VARCHAR(255),
  ADD COLUMN "google_traits"      JSONB;
