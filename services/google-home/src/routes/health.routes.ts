import { Router } from 'express';

const router = Router();
router.get('/', (_req, res) => res.json({ status: 'ok', service: 'google-home' }));
export default router;
