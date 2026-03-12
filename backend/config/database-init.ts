import db from './db';

export async function initializeDatabase() {
  try {
    // Create esp_devices table if it doesn't exist
    await db.query(`
      CREATE TABLE IF NOT EXISTS esp_devices (
        device_mac_id VARCHAR(255) NOT NULL UNIQUE PRIMARY KEY,
        device_name VARCHAR(255) NOT NULL,
        status INTEGER DEFAULT 0,
        is_on BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ Database initialized: esp_devices table ready');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}
