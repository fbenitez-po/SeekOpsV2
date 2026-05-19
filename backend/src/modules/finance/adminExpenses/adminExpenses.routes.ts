import { Router } from 'express';
import { verifyToken, adminOnly } from '../../../shared/middlewares/auth';
import { asyncHandler } from '../../../shared/http/asyncHandler';
import * as repo from './adminExpenses.repository';

const router = Router();
router.use(verifyToken, adminOnly);

router.get('/', asyncHandler(async (req, res) => {
  res.json(await repo.findAll(req.query['periodo_id'] as string | undefined));
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const item = await repo.findById(req.params['id'] as string);
  if (!item) { res.status(404).json({ error: 'Gasto no encontrado' }); return; }
  res.json(item);
}));

router.post('/', asyncHandler(async (req, res) => {
  const { periodo_id, codigo, descripcion, monto } = req.body as Record<string, unknown>;
  if (!periodo_id || !codigo || monto === undefined || monto === null) {
    res.status(400).json({ error: 'periodo_id, codigo y monto son requeridos' }); return;
  }
  if (Number(monto) < 0) { res.status(400).json({ error: 'El monto no puede ser negativo' }); return; }
  const created = await repo.create(
    { period_id: String(periodo_id), codigo: String(codigo), descripcion: descripcion as string | null, monto: Number(monto) },
    req.user?.email ?? null,
  );
  res.status(201).json(created);
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const { periodo_id, codigo, descripcion, monto } = req.body as Record<string, unknown>;
  if (!periodo_id || !codigo || monto === undefined || monto === null) {
    res.status(400).json({ error: 'periodo_id, codigo y monto son requeridos' }); return;
  }
  if (Number(monto) < 0) { res.status(400).json({ error: 'El monto no puede ser negativo' }); return; }
  const updated = await repo.update(
    req.params['id'] as string,
    { period_id: String(periodo_id), codigo: String(codigo), descripcion: descripcion as string | null, monto: Number(monto) },
    req.user?.email ?? null,
  );
  if (!updated) { res.status(404).json({ error: 'Gasto no encontrado' }); return; }
  res.json(updated);
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const ok = await repo.remove(req.params['id'] as string);
  if (!ok) { res.status(404).json({ error: 'Gasto no encontrado' }); return; }
  res.json({ ok: true });
}));

export default router;
