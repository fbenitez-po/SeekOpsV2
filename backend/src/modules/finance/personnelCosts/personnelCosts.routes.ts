import { Router } from 'express';
import { verifyToken, adminOnly } from '../../../shared/middlewares/auth';
import { asyncHandler } from '../../../shared/http/asyncHandler';
import * as repo from './personnelCosts.repository';

const router = Router();
router.use(verifyToken, adminOnly);

router.get('/', asyncHandler(async (req, res) => {
  res.json(await repo.findAll(req.query['periodo_id'] as string | undefined));
}));

router.post('/import', asyncHandler(async (req, res) => {
  const filas = req.body as Record<string, unknown>[];
  if (!Array.isArray(filas) || filas.length === 0) {
    res.status(400).json({ error: 'Se debe enviar un array con al menos un registro' }); return;
  }
  const email = req.user?.email ?? null;
  let insertados = 0;
  const errores: { fila: number; error: string }[] = [];

  for (let i = 0; i < filas.length; i++) {
    const { periodo_id, user_id, remuneracion, dias_habiles, horas_por_dia } = filas[i];
    if (!periodo_id || !user_id || remuneracion === undefined || !dias_habiles) {
      errores.push({ fila: i + 1, error: 'Faltan campos requeridos' }); continue;
    }
    const horas = horas_por_dia !== undefined && horas_por_dia !== null ? Number(horas_por_dia) : 8;
    try {
      await repo.upsertImport(
        {
          period_id: String(periodo_id),
          user_id: String(user_id),
          compensation: Number(remuneracion),
          business_days: Number(dias_habiles),
          hours_per_day: horas,
        },
        email,
      );
      insertados++;
    } catch (e) {
      errores.push({ fila: i + 1, error: (e as Error).message });
    }
  }
  res.json({ insertados, errores });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const item = await repo.findById(req.params['id'] as string);
  if (!item) { res.status(404).json({ error: 'Registro no encontrado' }); return; }
  res.json(item);
}));

router.post('/', asyncHandler(async (req, res) => {
  const { periodo_id, user_id, remuneracion, dias_habiles, horas_por_dia } = req.body as Record<string, unknown>;
  if (!periodo_id || !user_id || remuneracion === undefined || remuneracion === null || !dias_habiles) {
    res.status(400).json({ error: 'periodo_id, user_id, remuneracion y dias_habiles son requeridos' }); return;
  }
  if (Number(remuneracion) < 0) { res.status(400).json({ error: 'La remuneración no puede ser negativa' }); return; }
  if (Number(dias_habiles) <= 0) { res.status(400).json({ error: 'Los días hábiles deben ser mayores a 0' }); return; }
  const horas = horas_por_dia !== undefined && horas_por_dia !== null ? Number(horas_por_dia) : 8;
  if (horas <= 0) { res.status(400).json({ error: 'Las horas por día deben ser mayores a 0' }); return; }
  const created = await repo.create(
    {
      period_id: String(periodo_id),
      user_id: String(user_id),
      compensation: Number(remuneracion),
      business_days: Number(dias_habiles),
      hours_per_day: horas,
    },
    req.user?.email ?? null,
  );
  res.status(201).json(created);
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const { periodo_id, user_id, remuneracion, dias_habiles, horas_por_dia } = req.body as Record<string, unknown>;
  if (!periodo_id || !user_id || remuneracion === undefined || remuneracion === null || !dias_habiles) {
    res.status(400).json({ error: 'periodo_id, user_id, remuneracion y dias_habiles son requeridos' }); return;
  }
  if (Number(remuneracion) < 0) { res.status(400).json({ error: 'La remuneración no puede ser negativa' }); return; }
  if (Number(dias_habiles) <= 0) { res.status(400).json({ error: 'Los días hábiles deben ser mayores a 0' }); return; }
  const horas = horas_por_dia !== undefined && horas_por_dia !== null ? Number(horas_por_dia) : 8;
  if (horas <= 0) { res.status(400).json({ error: 'Las horas por día deben ser mayores a 0' }); return; }
  const updated = await repo.update(
    req.params['id'] as string,
    {
      period_id: String(periodo_id),
      user_id: String(user_id),
      compensation: Number(remuneracion),
      business_days: Number(dias_habiles),
      hours_per_day: horas,
    },
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
