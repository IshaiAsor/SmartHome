import mqtt, { MqttClient } from 'mqtt';
import config from '../config/env.config';

class MqttService {
  client: MqttClient;

  constructor() {
    this.client = mqtt.connect(config.mqtt.brokerUrl, {
      username: config.mqtt.username,
      password: config.mqtt.password,
    });

    this.client.on('connect', () => {
      console.log('✅ Connected to MQTT Broker');

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

    this.client.on('message', (topic: string, message: Buffer) => {
      const payload = message.toString();

      if (topic.endsWith('/status')) {
        const parts = topic.split('/');
        const deviceId = parts[1];

        if (payload === 'online') {
          console.log(`🟢 Device Connected: ${deviceId}`);
        } else if (payload === 'offline') {
          console.log(`🔴 Device Disconnected: ${deviceId}`);
        }
      } else if (topic.endsWith('/data')) {
         console.log(`📊 Data from ${topic}: ${payload}`);
      }
    });
  }

  publishState(deviceId: string, isOn: boolean) {
    const payload = isOn ? '1' : '0';
    const topic = `home/${deviceId}/set`;
    console.log(`📤 Publishing MQTT -> ${topic}: ${payload}`);
    this.client.publish(topic, payload);
  }

  addUser(userName: string, password: string) {
    const addUserCmd = {
      commands: [{
        command: 'createClient',
        username: userName,
        password,
      }]
    };
    // adminClient is undeclared in original code; keep as TODO
    // adminClient.publish('$CONTROL/dynamic-security/v1', JSON.stringify(addUserCmd));
  }
}

export default new MqttService();