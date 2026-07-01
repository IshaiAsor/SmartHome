import express, { Request, Response } from 'express';
import { verifyToken } from '../middlewares/auth.middleware';
import { exceptionHandler } from '../middlewares/exception.middleware';
import { JwtPurpose } from '../services/jwt.service';
import { adminDeviceConfigService } from '../services/admin.device.config.service';

const router = express.Router();
router.use(verifyToken(JwtPurpose.app_usage));
router.use(exceptionHandler);

// Device types (catalog is build-published — read only)
router.get('/devices', async (req: Request, res: Response) => {
  res.json(await adminDeviceConfigService.listDeviceTypes());
});

// Capabilities for a device type
router.get('/devices/:id/capabilities', async (req: Request, res: Response) => {
  const { capabilitiesRepository } = await import('../dal/capabilities.repository');
  res.json(await capabilitiesRepository.getByDeviceTypeId(parseInt(req.params.id as string)));
});

// Actions for a device type (read only)
router.get('/devices/:id/actions', async (req: Request, res: Response) => {
  res.json(await adminDeviceConfigService.listActions(parseInt(req.params.id as string)));
});

// Set default trait for a capability
router.patch('/capabilities/:capabilityId/traits/:traitId/default', async (req: Request, res: Response) => {
  await adminDeviceConfigService.setDefaultTrait(
    parseInt(req.params.capabilityId as string),
    parseInt(req.params.traitId as string),
  );
  res.sendStatus(204);
});

export default router;
