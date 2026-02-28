const express = require('express');
const router = express.Router();
const deviceRepo = require('../dal/device.repo');
const mqttService = require('../services/mqtt.service');

// GET /api/devices - Load dashboard
router.get('/', async (req, res) => {
  try {
    const devices = await deviceRepo.getAll();
    res.json(devices);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

// PATCH /api/devices/:id/state - Toggle from dashboard
router.patch('/:id/state', async (req, res) => {
  try {
    const { isOn } = req.body;
    const updatedDevice = await deviceRepo.updateState(req.params.id, isOn);
    
    // Fire the hardware command
    mqttService.publishState(req.params.id, isOn);

    res.json(updatedDevice);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

module.exports = router;