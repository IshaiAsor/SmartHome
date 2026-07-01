-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "google_action_types" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "value" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "google_action_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "google_device_traits" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "value" VARCHAR(255) NOT NULL,
    "valid_parameters" JSONB,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "google_device_traits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devices" (
    "id" SERIAL NOT NULL,
    "type" VARCHAR(255) NOT NULL,
    "version" VARCHAR(255) NOT NULL,
    "default_name" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_capabilities" (
    "id" SERIAL NOT NULL,
    "device_id" INTEGER NOT NULL,
    "capability_key" VARCHAR(64) NOT NULL,
    "label" VARCHAR(255) NOT NULL,
    "implementation_type" VARCHAR(64) NOT NULL,
    "mqtt_action_type" VARCHAR(32) NOT NULL,
    "mqtt_action_name" VARCHAR(64) NOT NULL,
    "min_telemetry_interval_ms" INTEGER,
    "google_type_id" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "device_capabilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_capability_traits" (
    "id" SERIAL NOT NULL,
    "capability_id" INTEGER NOT NULL,
    "google_trait_id" INTEGER NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "device_capability_traits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_capability_pins" (
    "id" SERIAL NOT NULL,
    "capability_id" INTEGER NOT NULL,
    "key" VARCHAR(50) NOT NULL,
    "label" VARCHAR(100) NOT NULL,
    "mode" VARCHAR(20) NOT NULL,

    CONSTRAINT "device_capability_pins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ml_models" (
    "id" SERIAL NOT NULL,
    "kind" VARCHAR(10) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "version" VARCHAR(50) NOT NULL,
    "backend" VARCHAR(20) NOT NULL,
    "model_file" VARCHAR(255),
    "ollama_model" VARCHAR(255),
    "classes" JSONB,
    "config" JSONB,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ml_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "user_type" INTEGER NOT NULL DEFAULT 0,
    "user_role" VARCHAR(50) NOT NULL DEFAULT 'user',
    "user_name" VARCHAR(255),
    "password" VARCHAR(255),
    "google_id" VARCHAR(255),
    "email" VARCHAR(255) NOT NULL,
    "full_name" VARCHAR(255),
    "profile_picture_url" TEXT,
    "terms_accepted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mqtt_user" (
    "id" SERIAL NOT NULL,
    "username" VARCHAR(100) NOT NULL,
    "password_hash" VARCHAR(100) NOT NULL,
    "is_superuser" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mqtt_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_login_audit" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "login_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "ip_address" VARCHAR(100),

    CONSTRAINT "user_login_audit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_devices" (
    "id" SERIAL NOT NULL,
    "device_type_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "mac_id" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "online" BOOLEAN NOT NULL DEFAULT false,
    "last_online_date" TIMESTAMP(6),
    "current_firmware_version" VARCHAR(64),
    "pending_device_type_id" INTEGER,
    "pending_firmware_version" VARCHAR(64),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_action_groups" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_action_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_device_actions" (
    "id" SERIAL NOT NULL,
    "user_device_id" INTEGER NOT NULL,
    "capability_id" INTEGER NOT NULL,
    "group_id" INTEGER,
    "default_trait_id" INTEGER,
    "action_name" VARCHAR(255) NOT NULL,
    "mqtt_action_name" VARCHAR(64) NOT NULL,
    "current_state" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "telemetry_interval_ms" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_device_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_device_action_pins" (
    "id" SERIAL NOT NULL,
    "user_device_action_id" INTEGER NOT NULL,
    "capability_pin_id" INTEGER NOT NULL,
    "pin_number" INTEGER NOT NULL,

    CONSTRAINT "user_device_action_pins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_rules" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "is_emergency" BOOLEAN NOT NULL DEFAULT false,
    "condition_operator" VARCHAR(3) NOT NULL DEFAULT 'AND',
    "cooldown_seconds" INTEGER NOT NULL DEFAULT 60,
    "last_triggered" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_rule_conditions" (
    "id" SERIAL NOT NULL,
    "rule_id" INTEGER NOT NULL,
    "condition_type" VARCHAR(20) NOT NULL,
    "user_device_action_id" INTEGER,
    "operator" VARCHAR(5),
    "threshold_value" VARCHAR(100),
    "user_device_id" INTEGER,
    "status_value" VARCHAR(20),
    "schedule_time" VARCHAR(5),
    "schedule_days" INTEGER[] DEFAULT ARRAY[]::INTEGER[],

    CONSTRAINT "user_rule_conditions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_rule_actions" (
    "id" SERIAL NOT NULL,
    "rule_id" INTEGER NOT NULL,
    "user_device_action_id" INTEGER NOT NULL,
    "target_state" VARCHAR(255) NOT NULL,
    "delay_seconds" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "user_rule_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_rule_events" (
    "id" SERIAL NOT NULL,
    "rule_id" INTEGER NOT NULL,
    "triggered_value" VARCHAR(255),
    "fired_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_rule_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pipelines" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pipelines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pipeline_sensors" (
    "id" SERIAL NOT NULL,
    "pipeline_id" INTEGER NOT NULL,
    "group_name" VARCHAR(100) NOT NULL,
    "user_device_action_id" INTEGER NOT NULL,
    "min_value" VARCHAR(50),
    "max_value" VARCHAR(50),

    CONSTRAINT "pipeline_sensors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pipeline_stages" (
    "id" SERIAL NOT NULL,
    "pipeline_id" INTEGER NOT NULL,
    "ordinal" INTEGER NOT NULL,
    "kind" VARCHAR(20) NOT NULL,
    "ml_model_id" INTEGER,
    "execute_user_device_action_id" INTEGER,
    "config" JSONB,

    CONSTRAINT "pipeline_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pipeline_triggers" (
    "id" SERIAL NOT NULL,
    "pipeline_id" INTEGER NOT NULL,
    "trigger_type" VARCHAR(20) NOT NULL,
    "user_device_action_id" INTEGER,
    "operator" VARCHAR(5),
    "threshold_value" VARCHAR(100),
    "schedule_cron" VARCHAR(100),
    "min_interval_sec" INTEGER,

    CONSTRAINT "pipeline_triggers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pipeline_runs" (
    "id" SERIAL NOT NULL,
    "pipeline_id" INTEGER NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "trigger_payload" JSONB,
    "started_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(6),

    CONSTRAINT "pipeline_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pipeline_run_stages" (
    "id" SERIAL NOT NULL,
    "run_id" INTEGER NOT NULL,
    "stage_id" INTEGER NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "input" JSONB,
    "output" JSONB,
    "started_at" TIMESTAMP(6),
    "completed_at" TIMESTAMP(6),

    CONSTRAINT "pipeline_run_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sensor_history" (
    "id" SERIAL NOT NULL,
    "user_device_action_id" INTEGER NOT NULL,
    "value" TEXT NOT NULL,
    "recorded_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sensor_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "google_action_types_value_key" ON "google_action_types"("value");

-- CreateIndex
CREATE UNIQUE INDEX "google_device_traits_value_key" ON "google_device_traits"("value");

-- CreateIndex
CREATE UNIQUE INDEX "devices_default_name_key" ON "devices"("default_name");

-- CreateIndex
CREATE UNIQUE INDEX "devices_type_version_key" ON "devices"("type", "version");

-- CreateIndex
CREATE UNIQUE INDEX "device_capabilities_device_id_capability_key_key" ON "device_capabilities"("device_id", "capability_key");

-- CreateIndex
CREATE UNIQUE INDEX "device_capability_traits_capability_id_google_trait_id_key" ON "device_capability_traits"("capability_id", "google_trait_id");

-- CreateIndex
CREATE UNIQUE INDEX "device_capability_pins_capability_id_key_key" ON "device_capability_pins"("capability_id", "key");

-- CreateIndex
CREATE UNIQUE INDEX "ml_models_kind_name_version_key" ON "ml_models"("kind", "name", "version");

-- CreateIndex
CREATE UNIQUE INDEX "users_user_name_key" ON "users"("user_name");

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "mqtt_user_username_key" ON "mqtt_user"("username");

-- CreateIndex
CREATE UNIQUE INDEX "user_devices_mac_id_key" ON "user_devices"("mac_id");

-- CreateIndex
CREATE INDEX "user_action_groups_user_id_sort_order_idx" ON "user_action_groups"("user_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "user_action_groups_user_id_name_key" ON "user_action_groups"("user_id", "name");

-- CreateIndex
CREATE INDEX "user_device_actions_user_device_id_mqtt_action_name_idx" ON "user_device_actions"("user_device_id", "mqtt_action_name");

-- CreateIndex
CREATE UNIQUE INDEX "user_device_action_pins_user_device_action_id_capability_pin_id_key" ON "user_device_action_pins"("user_device_action_id", "capability_pin_id");

-- CreateIndex
CREATE INDEX "user_rule_events_rule_id_fired_at_idx" ON "user_rule_events"("rule_id", "fired_at");

-- CreateIndex
CREATE INDEX "pipeline_sensors_pipeline_id_group_name_idx" ON "pipeline_sensors"("pipeline_id", "group_name");

-- CreateIndex
CREATE UNIQUE INDEX "pipeline_sensors_pipeline_id_user_device_action_id_key" ON "pipeline_sensors"("pipeline_id", "user_device_action_id");

-- CreateIndex
CREATE UNIQUE INDEX "pipeline_stages_pipeline_id_ordinal_key" ON "pipeline_stages"("pipeline_id", "ordinal");

-- CreateIndex
CREATE INDEX "pipeline_triggers_user_device_action_id_idx" ON "pipeline_triggers"("user_device_action_id");

-- CreateIndex
CREATE INDEX "pipeline_runs_pipeline_id_started_at_idx" ON "pipeline_runs"("pipeline_id", "started_at");

-- CreateIndex
CREATE UNIQUE INDEX "pipeline_run_stages_run_id_stage_id_key" ON "pipeline_run_stages"("run_id", "stage_id");

-- CreateIndex
CREATE INDEX "sensor_history_user_device_action_id_recorded_at_idx" ON "sensor_history"("user_device_action_id", "recorded_at");

-- AddForeignKey
ALTER TABLE "device_capabilities" ADD CONSTRAINT "device_capabilities_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_capabilities" ADD CONSTRAINT "device_capabilities_google_type_id_fkey" FOREIGN KEY ("google_type_id") REFERENCES "google_action_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_capability_traits" ADD CONSTRAINT "device_capability_traits_capability_id_fkey" FOREIGN KEY ("capability_id") REFERENCES "device_capabilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_capability_traits" ADD CONSTRAINT "device_capability_traits_google_trait_id_fkey" FOREIGN KEY ("google_trait_id") REFERENCES "google_device_traits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_capability_pins" ADD CONSTRAINT "device_capability_pins_capability_id_fkey" FOREIGN KEY ("capability_id") REFERENCES "device_capabilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_login_audit" ADD CONSTRAINT "user_login_audit_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_devices" ADD CONSTRAINT "user_devices_device_type_id_fkey" FOREIGN KEY ("device_type_id") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_devices" ADD CONSTRAINT "user_devices_pending_device_type_id_fkey" FOREIGN KEY ("pending_device_type_id") REFERENCES "devices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_devices" ADD CONSTRAINT "user_devices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_action_groups" ADD CONSTRAINT "user_action_groups_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_device_actions" ADD CONSTRAINT "user_device_actions_user_device_id_fkey" FOREIGN KEY ("user_device_id") REFERENCES "user_devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_device_actions" ADD CONSTRAINT "user_device_actions_capability_id_fkey" FOREIGN KEY ("capability_id") REFERENCES "device_capabilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_device_actions" ADD CONSTRAINT "user_device_actions_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "user_action_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_device_actions" ADD CONSTRAINT "user_device_actions_default_trait_id_fkey" FOREIGN KEY ("default_trait_id") REFERENCES "google_device_traits"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_device_action_pins" ADD CONSTRAINT "user_device_action_pins_user_device_action_id_fkey" FOREIGN KEY ("user_device_action_id") REFERENCES "user_device_actions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_device_action_pins" ADD CONSTRAINT "user_device_action_pins_capability_pin_id_fkey" FOREIGN KEY ("capability_pin_id") REFERENCES "device_capability_pins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_rules" ADD CONSTRAINT "user_rules_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_rule_conditions" ADD CONSTRAINT "user_rule_conditions_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "user_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_rule_conditions" ADD CONSTRAINT "user_rule_conditions_user_device_action_id_fkey" FOREIGN KEY ("user_device_action_id") REFERENCES "user_device_actions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_rule_conditions" ADD CONSTRAINT "user_rule_conditions_user_device_id_fkey" FOREIGN KEY ("user_device_id") REFERENCES "user_devices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_rule_actions" ADD CONSTRAINT "user_rule_actions_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "user_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_rule_actions" ADD CONSTRAINT "user_rule_actions_user_device_action_id_fkey" FOREIGN KEY ("user_device_action_id") REFERENCES "user_device_actions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_rule_events" ADD CONSTRAINT "user_rule_events_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "user_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pipelines" ADD CONSTRAINT "pipelines_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pipeline_sensors" ADD CONSTRAINT "pipeline_sensors_pipeline_id_fkey" FOREIGN KEY ("pipeline_id") REFERENCES "pipelines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pipeline_sensors" ADD CONSTRAINT "pipeline_sensors_user_device_action_id_fkey" FOREIGN KEY ("user_device_action_id") REFERENCES "user_device_actions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pipeline_stages" ADD CONSTRAINT "pipeline_stages_pipeline_id_fkey" FOREIGN KEY ("pipeline_id") REFERENCES "pipelines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pipeline_stages" ADD CONSTRAINT "pipeline_stages_ml_model_id_fkey" FOREIGN KEY ("ml_model_id") REFERENCES "ml_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pipeline_stages" ADD CONSTRAINT "pipeline_stages_execute_user_device_action_id_fkey" FOREIGN KEY ("execute_user_device_action_id") REFERENCES "user_device_actions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pipeline_triggers" ADD CONSTRAINT "pipeline_triggers_pipeline_id_fkey" FOREIGN KEY ("pipeline_id") REFERENCES "pipelines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pipeline_triggers" ADD CONSTRAINT "pipeline_triggers_user_device_action_id_fkey" FOREIGN KEY ("user_device_action_id") REFERENCES "user_device_actions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pipeline_runs" ADD CONSTRAINT "pipeline_runs_pipeline_id_fkey" FOREIGN KEY ("pipeline_id") REFERENCES "pipelines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pipeline_run_stages" ADD CONSTRAINT "pipeline_run_stages_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "pipeline_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pipeline_run_stages" ADD CONSTRAINT "pipeline_run_stages_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "pipeline_stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sensor_history" ADD CONSTRAINT "sensor_history_user_device_action_id_fkey" FOREIGN KEY ("user_device_action_id") REFERENCES "user_device_actions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

