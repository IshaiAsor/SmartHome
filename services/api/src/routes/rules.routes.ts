import { Router } from 'express';
import { requireAppToken } from '../middlewares/auth.middleware';
import { rulesService } from '../services/rules.service';

export const rulesRouter = Router();

rulesRouter.use(requireAppToken);

rulesRouter.get('/', async (req, res, next) => {
  try {
    res.json(await rulesService.list(req.user!.id));
  } catch (err) {
    next(err);
  }
});

// Fire events (UserRuleEvent). ?emergency=true → only emergency rules' events.
rulesRouter.get('/events', async (req, res, next) => {
  try {
    const limit = Number(req.query['limit'] ?? 50);
    const emergencyOnly = req.query['emergency'] === 'true';
    res.json(await rulesService.listEvents(req.user!.id, isNaN(limit) ? 50 : limit, emergencyOnly));
  } catch (err) {
    next(err);
  }
});

rulesRouter.post('/', async (req, res, next) => {
  try {
    res.status(201).json(await rulesService.create(req.user!.id, req.body));
  } catch (err) {
    next(err);
  }
});

rulesRouter.put('/:id', async (req, res, next) => {
  try {
    res.json(await rulesService.update(req.user!.id, Number(req.params.id), req.body));
  } catch (err) {
    next(err);
  }
});

rulesRouter.patch('/:id/toggle', async (req, res, next) => {
  try {
    await rulesService.setEnabled(req.user!.id, Number(req.params.id), req.body?.enabled === true);
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
});

rulesRouter.delete('/:id', async (req, res, next) => {
  try {
    await rulesService.remove(req.user!.id, Number(req.params.id));
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
});
