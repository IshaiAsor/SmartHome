import express from 'express';
import { verifyToken } from '../middlewares/auth.middleware';
import { exceptionHandler } from '../middlewares/exception.middleware';
import { JwtPurpose } from '../services/jwt.service';
import { vlmRepository } from '../dal/vlm.repository';
import { vlmLogRepository } from '../dal/vlm.log.repository';

const router = express.Router();
router.use(verifyToken(JwtPurpose.app_usage));
router.use(exceptionHandler);

// --- VLM Models ---

router.get('/models', async (req, res) => {
  const models = await vlmRepository.getModelsByUserId(req.user.id);
  res.json(models);
});

router.post('/models', async (req, res) => {
  const { name, type, endpoint_url, config } = req.body as {
    name: string; type: string; endpoint_url: string; config?: object;
  };
  const model = await vlmRepository.createModel({ user_id: req.user.id, name, type, endpoint_url, config });
  res.status(201).json(model);
});

router.delete('/models/:id', async (req, res) => {
  await vlmRepository.deleteModel(parseInt(req.params.id), req.user.id);
  res.status(204).send();
});

// --- Device VLM Configs ---

router.get('/devices', async (req, res) => {
  const configs = await vlmRepository.getDeviceConfigsByUserId(req.user.id);
  res.json(configs);
});

router.post('/devices', async (req, res) => {
  const { user_device_action_id, vlm_model_id, enabled, analysis_interval_sec } = req.body as {
    user_device_action_id: number;
    vlm_model_id: number;
    enabled?: boolean;
    analysis_interval_sec?: number;
  };
  const cfg = await vlmRepository.upsertDeviceConfig({ user_device_action_id, vlm_model_id, enabled, analysis_interval_sec });
  res.status(201).json(cfg);
});

router.delete('/devices/:id', async (req, res) => {
  await vlmRepository.deleteDeviceConfig(parseInt(req.params.id), req.user.id);
  res.status(204).send();
});

// --- Analysis Logs (debug) ---

router.get('/logs', async (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
  const logs = await vlmLogRepository.getRecent(req.user.id, limit);
  res.json(logs);
});

export default router;
