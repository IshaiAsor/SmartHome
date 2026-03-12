import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import fs from 'fs'; // Import filesystem to check for the folder
import config from './config/env.config';
import { initializeDatabase } from './config/database-init';

import apiRoutes from './routes/device.routes';
import googleRoutes from './routes/google.routes';

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 1. Mount API Routes FIRST
// This ensures they work even if the static files aren't found
app.use('/api/devices', apiRoutes);
app.use('/', googleRoutes);

// 2. Conditional Static File Serving
const rootDir = process.cwd();
// In your Dockerfile, we copy to 'dist/public'. 
// Locally, this folder won't exist, so we check for it.
const publicPath = path.join(rootDir, 'dist', 'public');

if (fs.existsSync(publicPath)) {
    console.log(`✅ Serving static files from: ${publicPath}`);
    app.use(express.static(publicPath));

    // Catch-all for Angular Routing (Only if public exists)
    // Using '/*' instead of '(.*)' is the standard fix for Express 5 path errors
    
    app.get('/:any', (req: express.Request, res: express.Response) => {
        res.sendFile(path.join(publicPath, 'index.html'));
    });
} else {
    console.log('ℹ️ Static "public" folder not found. Running in API-only mode.');
    
    // Optional: Basic landing page for local dev so it's not a 404
    app.get('/', (req, res) => {
        res.send('Smart Home API is running. (Angular UI not found in dist/public)');
    });
}

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