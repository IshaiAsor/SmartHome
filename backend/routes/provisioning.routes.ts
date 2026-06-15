import express, { Request, Response } from 'express';
import { verifyToken } from '../middlewares/auth.middleware';
import { provisioningService } from '../services/provisioning.service';
import { JwtPurpose } from '../services/jwt.service';

const router = express.Router();

router.get('/provision-token', verifyToken(JwtPurpose.app_usage), async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  if (!userId) {
    return res.status(401).send('User not authenticated');
  }
  const token = await provisioningService.GenerateProvisioningToken(userId);
  res.send(token);
});

router.post('/provision', verifyToken(JwtPurpose.device_provisioning), async (req: Request, res: Response) => {
  try {
    const { macAddress, deviceType, version, capabilities } = req.body;
    if (!macAddress || !deviceType || !version || !Array.isArray(capabilities)) {
      return res.status(400).json({ error: 'Missing required fields: macAddress, deviceType, version, capabilities' });
    }
    const result = await provisioningService.provisionDevice(
      req.user.userId, macAddress, deviceType, version, capabilities,
    );
    res.json(result);
  } catch (err: any) {
    console.error('[provision] ERROR:', err?.message, err?.stack);
    res.status(500).json({ error: err?.message || 'Internal Server Error' });
  }
});

router.post('/refresh-token', verifyToken(JwtPurpose.device_usage_refresh), async (req: Request, res: Response) => {
  const refreshToken = req.body.refreshToken;
  const result = await provisioningService.RefreshMqttToken(refreshToken);
  res.json(result);
});

export default router;
