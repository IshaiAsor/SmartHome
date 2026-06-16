import { Router } from 'express';
import { requireDeviceToken } from '../middlewares/device.auth.middleware';
import { JwtPurpose } from '../services/jwt.service';
import { provisioningService } from '../services/provisioning.service';

export const provisioningRouter = Router();

// NOTE: `GET /provision-token` is app-facing (app_usage, called by the UI) and stays on
// the backend/api — the staging ingress routes that exact path to web-app. The token it
// mints is a JWT on the shared secret, verified here on /provision below.

// Device's single provisioning call.
provisioningRouter.post(
  '/provision',
  requireDeviceToken(JwtPurpose.device_provisioning),
  async (req, res) => {
    const userId = Number((req.device as { userId?: string | number }).userId);
    const { macAddress, deviceType, version, capabilities } = req.body ?? {};
    if (!macAddress || !deviceType || !version || !Array.isArray(capabilities)) {
      res.status(400).json({ error: 'Missing required fields: macAddress, deviceType, version, capabilities' });
      return;
    }
    const result = await provisioningService.provisionDevice(userId, macAddress, deviceType, version, capabilities);
    res.json(result);
  },
);

// Device exchanges its refresh token (in the body) for a fresh device_usage JWT.
provisioningRouter.post('/refresh-token', async (req, res) => {
  const refreshToken = req.body?.refreshToken;
  if (!refreshToken) {
    res.status(400).json({ error: 'refreshToken is required' });
    return;
  }
  const result = provisioningService.refreshMqttToken(refreshToken);
  res.json(result);
});
