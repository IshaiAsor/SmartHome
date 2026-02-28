require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  mqtt: {
    brokerUrl: process.env.MQTT_BROKER_URL || 'mqtt://test.mosquitto.org',
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD
  },
  db: {
    // We will use these later when swapping the mock for the real pg library
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'smarthome_db'
  }
};