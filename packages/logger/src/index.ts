import pino from 'pino';

export type { Logger } from 'pino';

const isDev = process.env['NODE_ENV'] !== 'production';

export function createLogger(
  service: string,
  options?: { extra?: Record<string, unknown>; mixin?: () => Record<string, unknown> },
) {
  return pino({
    name: service,
    level: process.env['LOG_LEVEL'] ?? (isDev ? 'debug' : 'info'),
    transport: isDev
      ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:HH:MM:ss' } }
      : undefined,
    base: options?.extra ? { service, ...options.extra } : { service },
    mixin: options?.mixin,
  });
}
