import express, { Request, Response } from 'express';
import { smarthome } from 'actions-on-google';
import deviceRepo from '../dal/device.repo';
import mqttService from '../services/mqtt.service';

const router = express.Router();

// --- 1. Dummy OAuth Endpoints ---
router.get('/auth', (req: Request, res: Response) => {
  const { redirect_uri, state } = req.query as any;
  res.redirect(`${redirect_uri}?code=my-secret-auth-code&state=${state}`);
});

router.post('/token', (req: Request, res: Response) => {
  res.json({
    token_type: 'Bearer',
    access_token: 'dummy-access-token',
    refresh_token: 'dummy-refresh-token',
    expires_in: 31536000
  });
});

// --- 2. Smart Home Webhook ---
const appSmarthome = smarthome();

appSmarthome.onSync(async (body: any, headers: any) => {
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
  const dbDevices = await deviceRepo.getAll();
  const queryDevices: Record<string, any> = {};
  
  dbDevices.forEach((d: any) => {
    queryDevices[d.id] = { on: d.is_on, online: true };
  });

  return { requestId: body.requestId, payload: { devices: queryDevices } };
});

appSmarthome.onExecute(async (body: any, headers) => {
  const command = body.inputs[0].payload.commands[0];
  const execution = command.execution[0];
  const isTurnedOn = execution.params.on;
  
  const successfulIds: string[] = [];

  for (const device of command.devices) {
    try {
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