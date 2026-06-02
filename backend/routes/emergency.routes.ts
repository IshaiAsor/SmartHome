import express from 'express';
import { verifyToken } from '../middlewares/auth.middleware';
import { exceptionHandler } from '../middlewares/exception.middleware';
import { JwtPurpose } from '../services/jwt.service';
import { emergencyRepository } from '../dal/emergency.repository';

const router = express.Router();
router.use(verifyToken(JwtPurpose.app_usage));
router.use(exceptionHandler);

router.get('/rules', async (req, res) => {
  const rules = await emergencyRepository.getByUserId(req.user.id);
  res.json(rules);
});

router.post('/rules', async (req, res) => {
  const { name, user_device_action_id, operator, threshold_value, target_action_id, target_state } = req.body as {
    name: string;
    user_device_action_id: number;
    operator: string;
    threshold_value: string;
    target_action_id?: number;
    target_state?: string;
  };
  const rule = await emergencyRepository.create({
    user_id: req.user.id,
    name, user_device_action_id, operator, threshold_value, target_action_id, target_state,
  });
  res.status(201).json(rule);
});

router.patch('/rules/:id/toggle', async (req, res) => {
  const { enabled } = req.body as { enabled: boolean };
  await emergencyRepository.toggle(parseInt(req.params.id), req.user.id, enabled);
  res.status(204).send();
});

router.delete('/rules/:id', async (req, res) => {
  await emergencyRepository.delete(parseInt(req.params.id), req.user.id);
  res.status(204).send();
});

router.get('/events', async (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
  const events = await emergencyRepository.getRecentEvents(req.user.id, limit);
  res.json(events);
});

export default router;
