require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  mqtt: {
    brokerUrl: process.env.MQTT_BROKER_URL,
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD
  }
};