export const env = {
  port:         parseInt(process.env['PORT'] ?? '3004', 10),
  jwtSecret:    process.env['JWT_SECRET'] ?? 'dev-secret',
  logLevel:     process.env['LOG_LEVEL'] ?? 'info',
  otelEndpoint: process.env['OTEL_EXPORTER_OTLP_ENDPOINT'],

  jwt: {
    deviceProvisioningExpiresIn: parseInt(process.env['DEVICE_PROVISION_EXPIRES_IN']    ?? '3600'),
    deviceExpiresIn:             parseInt(process.env['JWT_DEVICE_USAGE_EXPIRES_IN']    ?? '31536000'),
    deviceTempExpiresIn:         parseInt(process.env['JWT_DEVICE_TEMP_USAGE_EXPIRES_IN'] ?? '300'),
    deviceRefreshExpiresIn:      parseInt(process.env['JWT_DEVICE_USAGE_REFRESH_EXPIRES_IN'] ?? '315360000'),
  },
};
