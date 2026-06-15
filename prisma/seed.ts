import pg from 'pg';
import bcrypt from 'bcryptjs';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  // Google Action Types
  console.log('🌱 Seeding google_action_types...');
  await pool.query(`
    INSERT INTO google_action_types (name, value) VALUES
      ('Outlet',     'action.devices.types.OUTLET'),
      ('Light',      'action.devices.types.LIGHT'),
      ('Switch',     'action.devices.types.SWITCH'),
      ('Thermostat', 'action.devices.types.THERMOSTAT'),
      ('Fan',        'action.devices.types.FAN'),
      ('Blinds',     'action.devices.types.BLINDS'),
      ('Sensor',     'action.devices.types.SENSOR'),
      ('Camera',     'action.devices.types.CAMERA')
    ON CONFLICT (value) DO NOTHING
  `);

  // Google Device Traits
  console.log('🌱 Seeding google_device_traits...');
  await pool.query(`
    INSERT INTO google_device_traits (name, value, valid_parameters) VALUES
      ('On / Off',             'action.devices.traits.OnOff',              '["on","off"]'),
      ('Brightness',           'action.devices.traits.Brightness',         '["brightness"]'),
      ('Color Setting',        'action.devices.traits.ColorSetting',       '["color"]'),
      ('Open / Close',         'action.devices.traits.OpenClose',          '["openPercent", "openDirection"]'),
      ('Temperature Setting',  'action.devices.traits.TemperatureSetting', '["thermostatMode", "thermostatTemperatureSetpoint", "thermostatTemperatureSetpointHigh", "thermostatTemperatureSetpointLow"]'),
      ('Fan Speed',            'action.devices.traits.FanSpeed',           '["fanSpeed", "fanSpeedRelativeWeight", "fanSpeedRelativePercentage"]'),
      ('Water Level',          'action.devices.traits.WaterLevel',         '["waterLevelPercent"]'),
      ('pH Level',             'action.devices.traits.PhLevel',            '["phValue"]'),
      ('TDS Level',            'action.devices.traits.TdsLevel',           '["tdsPpm"]'),
      ('CO2 Level',            'action.devices.traits.CO2Level',           '["co2Ppm"]'),
      ('Humidity Setting',     'action.devices.traits.HumiditySetting',    '["humidityAmbientPercent"]'),
      ('Camera Stream',        'action.devices.traits.CameraStream',       '[]'),
      ('Lock / Unlock',        'action.devices.traits.LockUnlock',         '["isLocked"]'),
      ('Start / Stop',         'action.devices.traits.StartStop',          '["isRunning"]')
    ON CONFLICT (value) DO NOTHING
  `);

  // MQTT app user
  const mqttUsername = process.env.MQTT_APP_USERNAME || 'ts_backend_app';
  const mqttPassword = process.env.MQTT_APP_PASSWORD || 'password123';
  console.log(`🌱 Seeding MQTT user: ${mqttUsername}`);
  await pool.query(
    `INSERT INTO mqtt_user (username, password_hash, is_superuser)
     VALUES ($1, $2, true)
     ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
    [mqttUsername, await bcrypt.hash(mqttPassword, 10)]
  );

  // Owner user
  const ownerEmail = process.env.OWNER_EMAIL;
  const ownerPassword = process.env.OWNER_PASSWORD;
  const ownerUsername = process.env.OWNER_USERNAME;
  if (ownerEmail && ownerPassword) {
    console.log(`🌱 Seeding owner user: ${ownerEmail}`);
    await pool.query(
      `INSERT INTO users (email, user_role, user_name, password, user_type)
       VALUES ($1, 'admin', $2, $3, 1)
       ON CONFLICT (email) DO NOTHING`,
      [ownerEmail, ownerUsername ?? null, await bcrypt.hash(ownerPassword, 10)]
    );
  }

  console.log('✅ Seed completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => pool.end());
