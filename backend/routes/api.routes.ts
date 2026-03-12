import express, { Request, Response } from 'express';
import deviceRepo from '../dal/device.repo';
import mqttService from '../services/mqtt.service';

const router = express.Router();

// GET /api/devices - Load dashboard
router.get('/', async (req: Request, res: Response) => {
  try {
    const devices = await deviceRepo.getAll();
    res.json(devices);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

// PATCH /api/devices/:id/state - Toggle from dashboard
router.patch('/:id/state', async (req: Request, res: Response) => {
  try {
    const { isOn } = req.body as { isOn: boolean };
    const id = String(req.params.id);
    const updatedDevice = await deviceRepo.updateState(id, isOn);
    
    // Fire the hardware command
    mqttService.publishState(id, isOn);

    res.json(updatedDevice);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

export default router;