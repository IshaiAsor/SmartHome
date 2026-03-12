import express, { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { smarthome } from 'actions-on-google';
import deviceRepo from '../dal/device.repo';
import mqttService from '../services/mqtt.service';
import config from '../config/env.config';
import { verifyToken } from './auth.middleware';
import { renderAuthPage } from '../views/auth.view';

const router = express.Router();

router.get('/auth', (req: Request, res: Response) => {
  console.log('Received auth request:', req.query);
  const { redirect_uri, state, client_id, response_type } = req.query as any;

  if (!client_id || !redirect_uri || !state || response_type !== 'code') {
    return res.status(400).send('Missing required parameters or invalid response_type');
  }

  // Render the login page, passing the parameters as hidden fields so we don't lose them
  const html = renderAuthPage('/auth/login', { redirect_uri, state, client_id, response_type });
  res.send(html);
});

router.post('/auth/login', (req: Request, res: Response) => {
  const { username, password, redirect_uri, state, client_id, response_type } = req.body;
  
  // Check credentials (using the same hardcoded admin/admin for now)
  if (username === 'admin' && password === 'admin') {
    // Success! Redirect the user back to Google with the auth code
    const redirectUrl = `${redirect_uri}?code=${config.googleAuth.googleAuthCode}&state=${state}`;
    res.redirect(redirectUrl);
  } else {
    // Failure! Re-render the form with an error message
    const html = renderAuthPage('/auth/login', { redirect_uri, state, client_id, response_type }, 'Invalid username or password');
    res.send(html);
  }
});

router.post('/token', (req: Request, res: Response) => {
  console.log('Received token request:', req.body);
  const token = jwt.sign({ user: 'google' }, config.jwtSecret, { expiresIn: '1h' });
  const refreshToken = jwt.sign({ user: 'google' }, config.jwtSecret, { expiresIn: '7d' });
  console.log('Token response:', { token, refreshToken });
  
  res.json({
    token_type: 'Bearer',
    access_token: token,
    refresh_token: refreshToken,
    expires_in: 3600
  });
});

// --- 2. Smart Home Webhook ---
const appSmarthome = smarthome();
appSmarthome.onSync(async (body: any, headers: any) => {
  console.log('Received sync request:', body);
  const dbDevices = await deviceRepo.getAll();
  
  const syncDevices = dbDevices.map((d: any) => ({
    id: d.device_mac_id,
    type: 'action.devices.types.OUTLET',
    traits: ['action.devices.traits.OnOff'],
    name: { name: d.device_name, defaultNames: [], nicknames: [] },
    willReportState: false
  }));
console.log('Sync response devices:', syncDevices);
  return {
    requestId: body.requestId,
    payload: { agentUserId: 'admin', devices: syncDevices }
  };
});

appSmarthome.onQuery(async (body, headers) => {
  console.log('Received query request:', body);
  const dbDevices = await deviceRepo.getAll();
  const queryDevices: Record<string, any> = {};
  
  dbDevices.forEach((d: any) => {
    queryDevices[d.device_mac_id] = { on: d.is_on, online: true };
  });
console.log('Query response devices:', queryDevices);
  return { requestId: body.requestId, payload: { devices: queryDevices } };
});

appSmarthome.onExecute(async (body: any, headers) => {
  console.log('Received execute request:', body);

  const command = body.inputs[0].payload.commands[0];
  const execution = command.execution[0];
  const isTurnedOn = execution.params.on;
  
  const successfulIds: string[] = [];

  for (const device of command.devices) {
    try {
      console.log(`Executing on ${device.id}`);
      await deviceRepo.updateState(device.id, isTurnedOn);
      successfulIds.push(device.id);
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

router.post('/smarthome', verifyToken, appSmarthome);

export default router;