import pg from 'pg';
import bcrypt from 'bcryptjs';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const mqttUsername = process.env.MQTT_APP_USERNAME || 'ts_backend_app';
  const mqttPassword = process.env.MQTT_APP_PASSWORD || 'password123';

  console.log(`🌱 Seeding MQTT user: ${mqttUsername}`);
  await pool.query(
    `INSERT INTO mqtt_user (username, password_hash, is_superuser)
     VALUES ($1, $2, true)
     ON CONFLICT (username) DO NOTHING`,
    [mqttUsername, await bcrypt.hash(mqttPassword, 10)]
  );

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
