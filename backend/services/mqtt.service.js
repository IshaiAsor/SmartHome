const mqtt = require('mqtt');
const config = require('../config/env.config');

class MqttService {
  constructor() {

    this.client = mqtt.connect(config.mqtt.brokerUrl,{username : config.mqtt.username, password: config.mqtt.password});

    this.client.on('connect', () => {
      console.log('✅ Connected to MQTT Broker');

      // 1. Subscribe to the topics you want to listen to.
      // The '+' is a wildcard for a single level (e.g., home/esp32/status)
      const topicsToSubscribe = ['home/+/status', 'home/+/data'];
      
      this.client.subscribe(topicsToSubscribe, (err) => {
        if (!err) {
          console.log(`🎧 Subscribed to topics: ${topicsToSubscribe.join(', ')}`);
        } else {
          console.error('❌ Subscription error:', err);
        }
      });
    });

    this.client.on('error', (err) => {
      console.error('❌ MQTT Error:', err);
    });

    // 2. Listen for incoming messages from the broker
    this.client.on('message', (topic, message) => {
      // The message is a Buffer, so we must convert it to a string
      const payload = message.toString();
      
      // console.log(`📩 Received -> Topic: ${topic} | Payload: ${payload}`);

      // 3. Handle Connect/Disconnect (Birth and LWT messages)
      if (topic.endsWith('/status')) {
        const parts = topic.split('/');
        const deviceId = parts[1]; // Extracts 'esp32' from 'home/esp32/status'

        if (payload === 'online') {
          console.log(`🟢 Device Connected: ${deviceId}`);
          // Update your database or frontend here
        } else if (payload === 'offline') {
          console.log(`🔴 Device Disconnected: ${deviceId}`);
          // Update your database or frontend here
        }
      } 
      // Handle normal data messages
      else if (topic.endsWith('/data')) {
         console.log(`📊 Data from ${topic}: ${payload}`);
      }
    });
  }

  publishState(deviceId, isOn) {
    const payload = isOn ? '1' : '0';
    const topic = `home/${deviceId}/set`;
    console.log(`📤 Publishing MQTT -> ${topic}: ${payload}`);
    this.client.publish(topic, payload);
  }
}

module.exports = new MqttService();