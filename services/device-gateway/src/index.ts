import { initOTel } from '@lattice/otel';
import { createLogger } from '@lattice/logger';
import express from 'express';
import { env } from './config/env.config';
import { healthRouter } from './routes/health.routes';
import { exceptionMiddleware } from './middlewares/exception.middleware';

// OTel must be initialised before any other imports that could create spans.
initOTel('device-gateway');

const log = createLogger('device-gateway');

async function main() {
  const app = express();
  app.use(express.json());
  app.use(healthRouter);
  app.use(exceptionMiddleware);

  app.listen(env.port, () => {
    log.info({ port: env.port }, 'device-gateway listening');
  });
}

main().catch((err) => {
  console.error('Fatal startup error', err);
  process.exit(1);
});
