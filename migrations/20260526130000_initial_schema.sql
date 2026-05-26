-- Enable the pgcrypto extension for bcrypt hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Google Action Types
CREATE TABLE IF NOT EXISTS google_action_types (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      value VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Initial Google Action Types Data
INSERT INTO google_action_types (name, value) VALUES
    ('Outlet', 'action.devices.types.OUTLET'),
    ('Light', 'action.devices.types.LIGHT'),
    ('Switch', 'action.devices.types.SWITCH'),
    ('Thermostat', 'action.devices.types.THERMOSTAT'),
    ('Fan', 'action.devices.types.FAN'),
    ('Blinds', 'action.devices.types.BLINDS'),
    ('Sensor', 'action.devices.types.SENSOR')
ON CONFLICT DO NOTHING;

-- Google Device Traits
CREATE TABLE IF NOT EXISTS google_device_traits (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            value VARCHAR(255) NOT NULL,
            valid_parameters JSONB,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

-- Initial Google Device Traits Data
INSERT INTO google_device_traits (name, value, valid_parameters) VALUES
    ('On / Off', 'action.devices.traits.OnOff', '["on","off"]'),
    ('Brightness', 'action.devices.traits.Brightness', '["brightness"]'),
    ('Color Setting', 'action.devices.traits.ColorSetting', '["color"]'),
    ('Open / Close', 'action.devices.traits.OpenClose', '["openPercent", "openDirection"]'),
    ('Temperature Setting', 'action.devices.traits.TemperatureSetting', '["thermostatMode", "thermostatTemperatureSetpoint", "thermostatTemperatureSetpointHigh", "thermostatTemperatureSetpointLow"]'),
    ('Fan Speed', 'action.devices.traits.FanSpeed', '["fanSpeed", "fanSpeedRelativeWeight", "fanSpeedRelativePercentage"]')
ON CONFLICT DO NOTHING;

-- Device Action Types
CREATE TABLE IF NOT EXISTS device_action_types (
        id SERIAL PRIMARY KEY,
        description VARCHAR(255) NOT NULL,
        google_type_id INTEGER NOT NULL REFERENCES google_action_types(id) ON DELETE CASCADE    
);

-- Devices
CREATE TABLE IF NOT EXISTS devices (
        id SERIAL PRIMARY KEY,
        type VARCHAR(255),
        version VARCHAR(255),
        default_name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

-- Device Actions
CREATE TABLE IF NOT EXISTS device_actions (
        id SERIAL PRIMARY KEY,
        device_id INTEGER NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
        default_name VARCHAR(255) NOT NULL,
        google_type_id INTEGER NOT NULL,
        mqtt_action_type VARCHAR(255),
        mqtt_action_name VARCHAR(255)
);

-- Action Type Traits
CREATE TABLE IF NOT EXISTS action_type_traits (
        id SERIAL PRIMARY KEY ,
        device_action_type_id INTEGER NOT NULL REFERENCES device_actions(id) ON DELETE CASCADE,
        google_trait_id INTEGER NOT NULL REFERENCES google_device_traits(id) ON DELETE CASCADE
);

-- Users
CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY ,
        user_type INT NOT NULL DEFAULT 0, -- 0 for regular users, 1 for google users
        user_role VARCHAR(50) NOT NULL DEFAULT 'user', -- 'user' or 'admin'
        user_name VARCHAR(255) UNIQUE, -- Only for regular users
        password VARCHAR(255), -- Only for regular users
        google_id VARCHAR(255) UNIQUE,
        email VARCHAR(255) UNIQUE NOT NULL,
        full_name VARCHAR(255),
        profile_picture_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

-- User Devices
CREATE TABLE IF NOT EXISTS user_devices (
        id SERIAL PRIMARY KEY,
        device_type_id INTEGER NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        mac_id VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        online BOOLEAN DEFAULT FALSE,
        last_online_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

-- User Device Actions
CREATE TABLE IF NOT EXISTS user_device_actions (
        id SERIAL PRIMARY KEY,
        user_device_id INTEGER NOT NULL REFERENCES user_devices(id) ON DELETE CASCADE,
        action_id INTEGER NOT NULL REFERENCES device_actions(id) ON DELETE CASCADE,
        action_name VARCHAR(255) NOT NULL,
        current_state VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

-- User Login Audit
CREATE TABLE IF NOT EXISTS user_login_audit (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        login_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        ip_address VARCHAR(100)
      );

-- MQTT User (for EMQX authentication)
CREATE TABLE IF NOT EXISTS mqtt_user (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    is_superuser BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- GRANTS (Roles will be created by the Job wrapper)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA PUBLIC TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA PUBLIC TO app_user;
GRANT SELECT ON mqtt_user TO emqx;

-- Initial Device Data
INSERT INTO devices (type, version, default_name, created_at, updated_at)
VALUES ('ESP32_SmartOutlet', 'V1.0.0', 'ESP32_SmartOutlet', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- Initial Device Actions
INSERT INTO device_actions (device_id, default_name, google_type_id, mqtt_action_type, mqtt_action_name)
SELECT id, 'outlet1', (SELECT id FROM google_action_types WHERE value = 'action.devices.types.OUTLET'), 'command', 'outlet1'
FROM devices WHERE default_name = 'ESP32_SmartOutlet'
ON CONFLICT DO NOTHING;

INSERT INTO device_actions (device_id, default_name, google_type_id, mqtt_action_type, mqtt_action_name)
SELECT id, 'Tempture Sensor 1', (SELECT id FROM google_action_types WHERE value = 'action.devices.types.SENSOR'), 'telemetry', 'sensor1'
FROM devices WHERE default_name = 'ESP32_SmartOutlet'
ON CONFLICT DO NOTHING;

-- Initial Action Type Traits
INSERT INTO action_type_traits (device_action_type_id, google_trait_id) 
SELECT id, (SELECT id FROM google_device_traits WHERE value = 'action.devices.traits.OnOff')
FROM device_actions WHERE default_name = 'outlet1'
ON CONFLICT DO NOTHING;
