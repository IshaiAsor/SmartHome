export interface MqttConfig {
  brokerUrl: string;
  serverName?: string;
  username?: string;
  password?: string;
}

export interface GoogleAuthConfig {
  code: string;
  accessToken: string;
  refreshToken: string;
}

export interface EnvConfig {
  port: number;
  mqtt: MqttConfig;
  googleAuth: GoogleAuthConfig;
}

const config: EnvConfig = {
  port: +(process.env.PORT || 3000),
  mqtt: {
    brokerUrl: process.env.MQTT_BROKER_URL||'',
    serverName: process.env.MQTT_SERVER_NAME ,
    username: process.env.MQTT_USERNAME  ,
    password: process.env.MQTT_PASSWORD ,
  },
  googleAuth: {
    code: process.env.GOOGLE_AUTH_CODE || 'my-secret-auth-code',
    accessToken: process.env.GOOGLE_AUTH_ACCESS_TOKEN || 'dummy-access-token',
    refreshToken: process.env.GOOGLE_AUTH_REFRESH_TOKEN || 'dummy-refresh-token',
  },
};

export default config;