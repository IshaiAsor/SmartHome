export interface MqttConfig {
  brokerUrl: string;
  serverName?: string;
  username?: string;
  password?: string;
}

export interface EnvConfig {
  port: number;
  mqtt: MqttConfig;
}

const config: EnvConfig = {
  port: +(process.env.PORT || 3000),
  mqtt: {
    brokerUrl: process.env.MQTT_BROKER_URL||'',
    serverName: process.env.MQTT_SERVER_NAME ,
    username: process.env.MQTT_USERNAME  ,
    password: process.env.MQTT_PASSWORD ,
  },
};

export default config;