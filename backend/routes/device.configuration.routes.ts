import express, { Request, Response } from 'express';
import { verifyTokenAny } from '../middlewares/auth.middleware';
import { exceptionHandler } from '../middlewares/exception.middleware';
import { JwtPurpose } from '../services/jwt.service';
import { deviceConfigurationService } from '../services/device.configuration.service';
import { userDevicesRepository } from '../dal/user.devices.repository';

const router = express.Router();
router.use(exceptionHandler);

// GET /api/device/:version/configuration
// Auth: device_usage JWT (clientid = userDevice.id)  OR  app_usage JWT (?deviceId=<userDevice.id>)
router.get('/:version/configuration', verifyTokenAny([JwtPurpose.device_usage, JwtPurpose.app_usage]), async (req: Request, res: Response) => {
  const version: string = String(req.params.version);
  if (!version || version === 'undefined') {
    return res.status(400).json({ error: 'Missing version in URL' });
  }

  let userDeviceId: number;

  if (req.user._jwtPurpose === JwtPurpose.device_usage) {
    userDeviceId = req.user.clientid;
    if (!userDeviceId) return res.status(400).json({ error: 'Missing deviceId in token' });
  } else {
    userDeviceId = parseInt(req.query.deviceId as string);
    if (!userDeviceId) return res.status(400).json({ error: 'deviceId query param required' });
    const userDevice = await userDevicesRepository.getById(userDeviceId);
    if (userDevice.user_id !== req.user.userId) return res.status(403).json({ error: 'Forbidden' });
  }

  const config = await deviceConfigurationService.getConfigurationForDevice(userDeviceId, version);
  return res.json(config);
});

export default router;
