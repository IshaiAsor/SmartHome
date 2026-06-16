import { Router } from 'express';
import { requireDeviceToken } from '../middlewares/device.auth.middleware';
import { JwtPurpose } from '../services/jwt.service';
import { deviceConfigurationService } from '../services/device-configuration.service';

export const deviceConfigurationRouter = Router();

// GET /api/device/:version/configuration
// Device-only: the device pulls its own firmware config (clientid = userDevice.id).
// App clients do NOT use this — the UI reads device config via the api management
// endpoints, so app_usage is intentionally not accepted here.
deviceConfigurationRouter.get(
  '/:version/configuration',
  requireDeviceToken(JwtPurpose.device_usage),
  async (req, res) => {
    const version = String(req.params.version);
    if (!version || version === 'undefined') {
      res.status(400).json({ error: 'Missing version in URL' });
      return;
    }

    const userDeviceId = Number((req.device as { clientid?: number }).clientid);
    if (!userDeviceId) {
      res.status(400).json({ error: 'Missing deviceId in token' });
      return;
    }

    const config = await deviceConfigurationService.getConfigurationForDevice(userDeviceId, version);
    res.json(config);
  },
);
