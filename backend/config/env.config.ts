export interface MqttConfig {
  brokerUrl: string;
  serverName?: string;
  username?: string;
  password?: string;
}

export interface GoogleAuthConfig {
  googleAuthCode?: string;
  googleAccessToken?: string;
  googleRefreshToken?: string;
}

export interface EnvConfig {
  port: number;
  mqtt: MqttConfig;
  googleAuth: GoogleAuthConfig;
  jwtSecret: string;
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
    googleAuthCode: process.env.GOOGLE_AUTH_CODE || '',
    googleAccessToken: process.env.GOOGLE_AUTH_ACCESS_TOKEN || '',
    googleRefreshToken: process.env.GOOGLE_AUTH_REFRESH_TOKEN || '',
  },
  jwtSecret: process.env.JWT_SECRET || 'default-secret',
};

export default config;