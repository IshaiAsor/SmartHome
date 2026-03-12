import express, { Request, Response } from 'express';
import deviceRepo from '../dal/device.repo';
// import mqttClient from '../mqtt-service'; // You would import your MQTT publisher here
import { verifyToken } from './auth.middleware';

const router = express.Router();
// Protect all routes in this file with JWT verification
router.use(verifyToken);
// GET /api/devices
router.get('/', async (req: Request, res: Response) => {
  try {
    const devices = await deviceRepo.getAll();
    const clientDevices = devices.map((d: any) => ({
      id: d.device_mac_id,
      name: d.device_name,
      type: 'outlet',
      is_on: d.is_on,
    }));
    res.json(clientDevices);
  } catch (error) {
    res.status(500).json({ error });
  }
});

// PATCH /api/devices/:id/state
router.patch('/:id/state', async (req: Request, res: Response) => {
  try {
    const { isOn } = req.body as { isOn: boolean };
    const id = String(req.params.id);
    const updatedDevice = await deviceRepo.updateState(id, isOn);
    
    // TODO: Fire MQTT command to the ESP32 here
    // mqttClient.publish(`home/${id}/set`, isOn ? '1' : '0');

    res.json(updatedDevice);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

export default router;