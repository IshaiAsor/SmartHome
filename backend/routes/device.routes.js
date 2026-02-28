const express = require('express');
const router = express.Router();
const deviceRepo = require('../dal/device.repo');
// const mqttClient = require('../mqtt-service'); // You would import your MQTT publisher here

// GET /api/devices
router.get('/', async (req, res) => {
  try {
    const devices = await deviceRepo.getAll();
    res.json(devices);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

// PATCH /api/devices/:id/state
router.patch('/:id/state', async (req, res) => {
  try {
    const { isOn } = req.body;
    const updatedDevice = await deviceRepo.updateState(req.params.id, isOn);
    
    // TODO: Fire MQTT command to the ESP32 here
    // mqttClient.publish(`home/${req.params.id}/set`, isOn ? '1' : '0');

    res.json(updatedDevice);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

module.exports = router;