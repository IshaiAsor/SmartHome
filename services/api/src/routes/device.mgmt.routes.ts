import { Router } from 'express';
import { requireAppToken } from '../middlewares/auth.middleware';
import { deviceMgmtService } from '../services/device.mgmt.service';

export const deviceMgmtRouter = Router();

deviceMgmtRouter.use(requireAppToken);

deviceMgmtRouter.get('/', async (req, res, next) => {
  try {
    res.json(await deviceMgmtService.listUserDevices(req.user!.id));
  } catch (err) {
    next(err);
  }
});

deviceMgmtRouter.patch('/:id', async (req, res, next) => {
  try {
    const { name } = req.body ?? {};
    res.json(await deviceMgmtService.renameDevice(req.user!.id, Number(req.params.id), name));
  } catch (err) {
    next(err);
  }
});

deviceMgmtRouter.delete('/:id', async (req, res, next) => {
  try {
    await deviceMgmtService.deleteDevice(req.user!.id, Number(req.params.id));
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
});

// ─── Capability activation (device-config page) ───────────────────────────
deviceMgmtRouter.get('/:id/capabilities', async (req, res, next) => {
  try {
    res.json(await deviceMgmtService.listCapabilities(req.user!.id, Number(req.params.id)));
  } catch (err) {
    next(err);
  }
});

deviceMgmtRouter.post('/:id/actions', async (req, res, next) => {
  try {
    const { capability_id, telemetry_interval_ms, pins } = req.body ?? {};
    res.status(201).json(
      await deviceMgmtService.activateCapability(req.user!.id, Number(req.params.id), {
        capability_id,
        telemetry_interval_ms,
        pins,
      }),
    );
  } catch (err) {
    next(err);
  }
});

deviceMgmtRouter.patch('/:id/actions/:actionId', async (req, res, next) => {
  try {
    const { name, telemetry_interval_ms, pins } = req.body ?? {};
    await deviceMgmtService.updateActivatedAction(
      req.user!.id,
      Number(req.params.id),
      Number(req.params.actionId),
      { name, telemetry_interval_ms, pins },
    );
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
});
