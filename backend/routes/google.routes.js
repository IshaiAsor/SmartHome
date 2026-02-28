const express = require('express');
const router = express.Router();
const { smarthome } = require('actions-on-google');
const deviceRepo = require('../dal/device.repo');
const mqttService = require('../services/mqtt.service');

// --- 1. Dummy OAuth Endpoints ---
router.get('/auth', (req, res) => {
  const { redirect_uri, state } = req.query;
  res.redirect(`${redirect_uri}?code=my-secret-auth-code&state=${state}`); 
});

router.post('/token', (req, res) => {
  res.json({
    token_type: 'Bearer',
    access_token: 'dummy-access-token',
    refresh_token: 'dummy-refresh-token',
    expires_in: 31536000
  });
});

// --- 2. Smart Home Webhook ---
const appSmarthome = smarthome();

appSmarthome.onSync(async (body, headers) => {
  const dbDevices = await deviceRepo.getAll();
  
  const syncDevices = dbDevices.map(d => ({
    id: d.id,
    type: d.type,
    traits: ['action.devices.traits.OnOff'],
    name: { name: d.name },
    willReportState: false
  }));

  return {
    requestId: body.requestId,
    payload: { agentUserId: 'admin', devices: syncDevices }
  };
});

appSmarthome.onQuery(async (body, headers) => {
  const dbDevices = await deviceRepo.getAll();
  let queryDevices = {};
  
  dbDevices.forEach(d => {
    queryDevices[d.id] = { on: d.is_on, online: true };
  });

  return { requestId: body.requestId, payload: { devices: queryDevices } };
});

appSmarthome.onExecute(async (body, headers) => {
  const command = body.inputs[0].payload.commands[0];
  const execution = command.execution[0];
  const isTurnedOn = execution.params.on;
  
  const successfulIds = [];

  // Use a for...of loop to handle async/await cleanly
  for (const device of command.devices) {
    try {
      // Update the database
      await deviceRepo.updateState(device.id, isTurnedOn);
      successfulIds.push(device.id);
      
      // Fire the hardware command
      mqttService.publishState(device.id, isTurnedOn);
    } catch (err) {
      console.error(`Failed to execute on ${device.id}`);
    }
  }

  return {
    requestId: body.requestId,
    payload: {
      commands: [{
        ids: successfulIds,
        status: 'SUCCESS',
        states: { on: isTurnedOn, online: true }
      }]
    }
  };
});

router.post('/smarthome', appSmarthome);

module.exports = router;