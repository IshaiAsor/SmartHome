-- CreateTable
CREATE TABLE "google_action_types" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "value" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "google_action_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "google_device_traits" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "value" VARCHAR(255) NOT NULL,
    "valid_parameters" JSONB,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "google_device_traits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_action_types" (
    "id" SERIAL NOT NULL,
    "description" VARCHAR(255) NOT NULL,
    "google_type_id" INTEGER NOT NULL,

    CONSTRAINT "device_action_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devices" (
    "id" SERIAL NOT NULL,
    "type" VARCHAR(255),
    "version" VARCHAR(255),
    "default_name" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_actions" (
    "id" SERIAL NOT NULL,
    "device_id" INTEGER NOT NULL,
    "default_name" VARCHAR(255) NOT NULL,
    "google_type_id" INTEGER NOT NULL,
    "mqtt_action_type" VARCHAR(255),
    "mqtt_action_name" VARCHAR(255),

    CONSTRAINT "device_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "action_type_traits" (
    "id" SERIAL NOT NULL,
    "device_action_type_id" INTEGER NOT NULL,
    "google_trait_id" INTEGER NOT NULL,

    CONSTRAINT "action_type_traits_pkey" PRIMARY KEY ("id")
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
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_devices" (
    "id" SERIAL NOT NULL,
    "device_type_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "mac_id" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "online" BOOLEAN DEFAULT false,
    "last_online_date" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_device_actions" (
    "id" SERIAL NOT NULL,
    "user_device_id" INTEGER NOT NULL,
    "action_id" INTEGER NOT NULL,
    "action_name" VARCHAR(255) NOT NULL,
    "current_state" VARCHAR(255),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_device_actions_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "mqtt_user" (
    "id" SERIAL NOT NULL,
    "username" VARCHAR(100) NOT NULL,
    "password_hash" VARCHAR(100) NOT NULL,
    "is_superuser" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mqtt_user_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "google_action_types_value_key" ON "google_action_types"("value");

-- CreateIndex
CREATE UNIQUE INDEX "google_device_traits_value_key" ON "google_device_traits"("value");

-- CreateIndex
CREATE UNIQUE INDEX "devices_default_name_key" ON "devices"("default_name");

-- CreateIndex
CREATE UNIQUE INDEX "device_actions_device_id_default_name_key" ON "device_actions"("device_id", "default_name");

-- CreateIndex
CREATE UNIQUE INDEX "users_user_name_key" ON "users"("user_name");

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_devices_mac_id_key" ON "user_devices"("mac_id");

-- CreateIndex
CREATE UNIQUE INDEX "mqtt_user_username_key" ON "mqtt_user"("username");

-- AddForeignKey
ALTER TABLE "device_action_types" ADD CONSTRAINT "device_action_types_google_type_id_fkey" FOREIGN KEY ("google_type_id") REFERENCES "google_action_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_actions" ADD CONSTRAINT "device_actions_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_type_traits" ADD CONSTRAINT "action_type_traits_device_action_type_id_fkey" FOREIGN KEY ("device_action_type_id") REFERENCES "device_actions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_type_traits" ADD CONSTRAINT "action_type_traits_google_trait_id_fkey" FOREIGN KEY ("google_trait_id") REFERENCES "google_device_traits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_devices" ADD CONSTRAINT "user_devices_device_type_id_fkey" FOREIGN KEY ("device_type_id") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_devices" ADD CONSTRAINT "user_devices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_device_actions" ADD CONSTRAINT "user_device_actions_user_device_id_fkey" FOREIGN KEY ("user_device_id") REFERENCES "user_devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_device_actions" ADD CONSTRAINT "user_device_actions_action_id_fkey" FOREIGN KEY ("action_id") REFERENCES "device_actions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_login_audit" ADD CONSTRAINT "user_login_audit_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Initial Google Action Types Data
INSERT INTO google_action_types (name, value) VALUES
    ('Outlet', 'action.devices.types.OUTLET'),
    ('Light', 'action.devices.types.LIGHT'),
    ('Switch', 'action.devices.types.SWITCH'),
    ('Thermostat', 'action.devices.types.THERMOSTAT'),
    ('Fan', 'action.devices.types.FAN'),
    ('Blinds', 'action.devices.types.BLINDS'),
    ('Sensor', 'action.devices.types.SENSOR')
ON CONFLICT (value) DO NOTHING;

-- Initial Google Device Traits Data
INSERT INTO google_device_traits (name, value, valid_parameters) VALUES
    ('On / Off', 'action.devices.traits.OnOff', '["on","off"]'),
    ('Brightness', 'action.devices.traits.Brightness', '["brightness"]'),
    ('Color Setting', 'action.devices.traits.ColorSetting', '["color"]'),
    ('Open / Close', 'action.devices.traits.OpenClose', '["openPercent", "openDirection"]'),
    ('Temperature Setting', 'action.devices.traits.TemperatureSetting', '["thermostatMode", "thermostatTemperatureSetpoint", "thermostatTemperatureSetpointHigh", "thermostatTemperatureSetpointLow"]'),
    ('Fan Speed', 'action.devices.traits.FanSpeed', '["fanSpeed", "fanSpeedRelativeWeight", "fanSpeedRelativePercentage"]')
ON CONFLICT (value) DO NOTHING;

-- Initial Device Data
INSERT INTO devices (type, version, default_name, created_at, updated_at)
VALUES ('ESP32_SmartOutlet', 'V1.0.0', 'ESP32_SmartOutlet', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (default_name) DO NOTHING;

-- Initial Device Actions
INSERT INTO device_actions (device_id, default_name, google_type_id, mqtt_action_type, mqtt_action_name)
SELECT d.id, 'outlet1', t.id, 'command', 'outlet1'
FROM devices d, google_action_types t
WHERE d.default_name = 'ESP32_SmartOutlet' AND t.value = 'action.devices.types.OUTLET'
ON CONFLICT (device_id, default_name) DO NOTHING;

INSERT INTO device_actions (device_id, default_name, google_type_id, mqtt_action_type, mqtt_action_name)
SELECT d.id, 'Tempture Sensor 1', t.id, 'telemetry', 'sensor1'
FROM devices d, google_action_types t
WHERE d.default_name = 'ESP32_SmartOutlet' AND t.value = 'action.devices.types.SENSOR'
ON CONFLICT (device_id, default_name) DO NOTHING;

-- Initial Action Type Traits
INSERT INTO action_type_traits (device_action_type_id, google_trait_id)
SELECT da.id, gt.id
FROM device_actions da, google_device_traits gt
WHERE da.default_name = 'outlet1' AND gt.value = 'action.devices.traits.OnOff'
ON CONFLICT DO NOTHING;

