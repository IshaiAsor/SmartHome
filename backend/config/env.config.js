require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  mqtt: {
    brokerUrl: process.env.MQTT_BROKER_URL,
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD
  },
  db: {
    // We will use these later when swapping the mock for the real pg library
    host: process.env.DB_HOST ,
    user: process.env.DB_USER ,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME 
  }
};