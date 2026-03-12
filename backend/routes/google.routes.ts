import express, { Request, Response } from 'express';
import { smarthome } from 'actions-on-google';
import deviceRepo from '../dal/device.repo';
import mqttService from '../services/mqtt.service';
import config from '../config/env.config';

const router = express.Router();

// --- 1. Dummy OAuth Endpoints ---
router.get('/auth', (req: Request, res: Response) => {
  const { redirect_uri, state } = req.query as any;
  res.redirect(`${redirect_uri}?code=${config.googleAuth.googleAuthCode}&state=${state}`);
});

router.post('/token', (req: Request, res: Response) => {
  console.log('Received token request:', req.body);
  res.json({
    token_type: 'Bearer',
    access_token: config.googleAuth.googleAccessToken,
    refresh_token: config.googleAuth.googleRefreshToken,
    expires_in: 31536000
  });
});

// --- 2. Smart Home Webhook ---
const appSmarthome = smarthome();

appSmarthome.onSync(async (body: any, headers: any) => {
  console.log('Received sync request:', body);
  const dbDevices = await deviceRepo.getAll();
  
  const syncDevices = dbDevices.map((d: any) => ({
    id: d.id,
    type: d.type,
    traits: ['action.devices.traits.OnOff'],
    name: { name: d.name, defaultNames: [], nicknames: [] },
    willReportState: false
  }));

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
    queryDevices[d.id] = { on: d.is_on, online: true };
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

router.post('/smarthome', appSmarthome);

export default router;