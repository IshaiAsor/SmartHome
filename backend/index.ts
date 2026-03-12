import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import config from './config/env.config';
import { initializeDatabase } from './config/database-init';

import apiRoutes from './routes/api.routes';
import googleRoutes from './routes/google.routes';

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Mount Routes
app.use('/api/devices', apiRoutes);  // Angular UI goes here
app.use('/', googleRoutes);          // Google goes to /auth, /token, and /smarthome

// 2. Serve the compiled Angular frontend
app.use(express.static(path.join(__dirname, 'public')));

// 3. Catch-all for Angular Routing (Must be the very last route!)
app.get(/(.*)/, (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialize database and start server
async function startServer() {
  await initializeDatabase();

  app.listen(config.port, () => {
    console.log(`🚀 Smart Home Server running on port ${config.port}`);
    console.log(`- UI API: http://localhost:${config.port}/api/devices`);
    console.log(`- Google Webhook: http://localhost:${config.port}/smarthome`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});