import { Router } from 'express';
import { verifyToken, adminOnly } from '../../shared/middlewares/auth';
import { asyncHandler } from '../../shared/http/asyncHandler';
import * as repo from './commercial.repository';
import type { CommercialInput } from './commercial.repository';

const router = Router();
router.use(verifyToken, adminOnly);

router.get('/document-types', asyncHandler(async (_req, res) => {
  res.json(await repo.findDocumentTypes());
}));

router.get('/', asyncHandler(async (req, res) => {
  res.json(await repo.findAll(req.query['proyecto_id'] as string | undefined));
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const item = await repo.findById(req.params['id'] as string);
  if (!item) { res.status(404).json({ error: 'Registro no encontrado' }); return; }
  res.json(item);
}));

router.post('/', asyncHandler(async (req, res) => {
  const body = req.body as Partial<CommercialInput>;
  const { fecha_registro, proyecto_id, responsable_id, precio } = body;
  if (!fecha_registro || !proyecto_id || !responsable_id || precio === undefined || precio === null) {
    res.status(400).json({ error: 'fecha_registro, proyecto_id, responsable_id y precio son requeridos' }); return;
  }
  if (Number(precio) < 0) { res.status(400).json({ error: 'El precio no puede ser negativo' }); return; }
  const created = await repo.create(
    { ...body, fecha_registro, proyecto_id, responsable_id, precio: Number(precio) } as CommercialInput,
    req.user?.email ?? null,
  );
  res.status(201).json(created);
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const body = req.body as Partial<CommercialInput>;
  const { fecha_registro, proyecto_id, responsable_id, precio } = body;
  if (!fecha_registro || !proyecto_id || !responsable_id || precio === undefined || precio === null) {
    res.status(400).json({ error: 'fecha_registro, proyecto_id, responsable_id y precio son requeridos' }); return;
  }
  if (Number(precio) < 0) { res.status(400).json({ error: 'El precio no puede ser negativo' }); return; }
  const updated = await repo.update(
    req.params['id'] as string,
    { ...body, fecha_registro, proyecto_id, responsable_id, precio: Number(precio) } as CommercialInput,
    req.user?.email ?? null,
  );
  if (!updated) { res.status(404).json({ error: 'Registro no encontrado' }); return; }
  res.json(updated);
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const ok = await repo.remove(req.params['id'] as string);
  if (!ok) { res.status(404).json({ error: 'Registro no encontrado' }); return; }
  res.json({ ok: true });
}));

export default router;
