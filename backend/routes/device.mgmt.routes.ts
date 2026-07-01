import express from 'express';
import commandDispatch from '../services/command.dispatch.service';
import { verifyToken } from '../middlewares/auth.middleware';
import { exceptionHandler } from '../middlewares/exception.middleware';
import { JwtPurpose } from '../services/jwt.service';

const router = express.Router();
router.use(verifyToken(JwtPurpose.app_usage));
router.use(exceptionHandler);

// Device list/rename/delete AND capability activation migrated to
// the new `api` service (F2.5). The handlers below serve only the not-yet-migrated
// device-lifecycle commands (reprovision/resets/restart).

router.post('/:deviceId/reprovision', async (req, res) => {
  const userId = req.user.id;
  const deviceId = parseInt(req.params.deviceId);
  await commandDispatch.publishCommand(userId, deviceId, 'reprovision', '');
  res.json({ message: 'Reprovision command sent' });
});

router.post('/:deviceId/soft-reset', async (req, res) => {
  const userId = req.user.id;
  const deviceId = parseInt(req.params.deviceId);
  await commandDispatch.publishCommand(userId, deviceId, 'soft-reset', '');
  res.json({ message: 'Soft reset command sent' });
});

router.post('/:deviceId/hard-reset', async (req, res) => {
  const userId = req.user.id;
  const deviceId = parseInt(req.params.deviceId);
  await commandDispatch.publishCommand(userId, deviceId, 'hard-reset', '');
  res.json({ message: 'Hard reset command sent' });
});

router.post('/:deviceId/restart', async (req, res) => {
  const userId = req.user.id;
  const deviceId = parseInt(req.params.deviceId);
  await commandDispatch.publishCommand(userId, deviceId, 'restart', '');
  res.json({ message: 'Restart command sent' });
});

export default router;
