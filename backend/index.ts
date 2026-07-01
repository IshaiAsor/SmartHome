import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import fs from 'fs';
import config from './config/env.config';
import deviceMgmtRoutes from './routes/device.mgmt.routes';
import googleRoutes from './routes/google.routes';
import adminDeviceConfigRoutes from './routes/admin.device.config.routes';
// vlm.routes removed — VLM/ML moved to dedicated ml-router/ml-executor services
import { sensorHistoryRepository } from './dal/sensor.history.repository';
import cron from 'node-cron';
import http from 'http';
import { redisService } from './services/redis.service';

const app = express();
app.set('trust proxy', 1); // trust Traefik ingress X-Forwarded-For header
// Real-time Socket.IO moved to services/socket-server (digest-service emits via the
// Valkey adapter). Device config + camera intake moved to services/device-gateway.
const server = http.createServer(app);

// Pre-parser debug logging
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] DEBUG: ${req.method} ${req.url}`);
  next();
});

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Post-parser debug logging
app.use((req, _res, next) => {
  if (req.method === 'POST' && !req.is('image/*')) {
    console.log(`[${new Date().toISOString()}] DEBUG: Parsed Body:`, JSON.stringify(req.body));
  }
  next();
});

// /api/auth + /api/mgmt/actions migrated to the new `api` service (F2). Device list/rename/
// delete also moved there — device.mgmt.routes now serves only the not-yet-migrated
// device-lifecycle ops (capability activation, reprovision, resets).
app.use('/api/mgmt/devices',  deviceMgmtRoutes);
app.use('/api/google', googleRoutes);
// /api/rules + /api/emergency migrated to the new `api` service (F6.3/F9, unified via
// UserRule.is_emergency). The monolith versions were already broken against the new schema.
app.use('/api/device-config', adminDeviceConfigRoutes);
// /api/vlm removed — VLM/ML moved to dedicated ml-router/ml-executor services


const rootDir = process.cwd();
const publicPath = path.join(rootDir, 'dist', 'public');

if (fs.existsSync(publicPath)) {
  console.log(`✅ Serving static files from: ${publicPath}`);
  app.use(express.static(publicPath));

  app.use((_req: express.Request, res: express.Response) => {
    res.sendFile(path.join(publicPath, 'index.html'));
  });
} else {
  console.log('ℹ️ Static "public" folder not found. Running in API-only mode.');

  app.get('/', (_req, res) => {
    res.send('Smart Home API is running. (Angular UI not found in dist/public)');
  });
}

async function startServer() {
  redisService.connect();
  // Rules evaluation cron moved to services/automation-worker (F6.2).

  // Prune sensor history older than 30 days (runs daily at midnight)
  cron.schedule('0 0 * * *', () =>
    sensorHistoryRepository.pruneOlderThan(30).catch(err =>
      console.error('[SensorHistory] Prune error:', err)
    )
  );

  server.listen(config.port, () => {
    console.log(`🚀 Smart Home Server running on port ${config.port}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

