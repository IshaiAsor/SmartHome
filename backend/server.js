const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path'); // Add this!
const config = require('./config/env.config.js');

const apiRoutes = require('./routes/api.routes.js');
const googleRoutes = require('./routes/google.routes.js');

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
app.get(/(.*)/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(config.port, () => {
  console.log(`🚀 Smart Home Server running on port ${config.port}`);
  console.log(`- UI API: http://localhost:${config.port}/api/devices`);
  console.log(`- Google Webhook: http://localhost:${config.port}/smarthome`);
});