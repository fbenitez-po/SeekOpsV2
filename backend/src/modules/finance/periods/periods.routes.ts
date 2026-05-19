import { Router } from 'express';
import { verifyToken, adminOnly } from '../../../shared/middlewares/auth';
import { asyncHandler } from '../../../shared/http/asyncHandler';
import * as repo from './periods.repository';

const router = Router();
router.use(verifyToken, adminOnly);

router.get('/', asyncHandler(async (_req, res) => {
  const now = new Date();
  res.json(await repo.findUpToCurrent(now.getFullYear(), now.getMonth() + 1));
}));

router.patch('/:id/toggle', asyncHandler(async (req, res) => {
  const period = await repo.toggle(req.params['id'] as string);
  if (!period) { res.status(404).json({ error: 'Periodo no encontrado' }); return; }
  res.json(period);
}));

export default router;
