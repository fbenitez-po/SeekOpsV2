import { Router } from 'express';
import { verifyToken, adminOnly } from '../../../shared/middlewares/auth';
import { asyncHandler } from '../../../shared/http/asyncHandler';
import * as repo from './revenues.repository';

const router = Router();
router.use(verifyToken, adminOnly);

router.get('/', asyncHandler(async (req, res) => {
  res.json(await repo.findAll(req.query['periodo_id'] as string | undefined));
}));

router.post('/import', asyncHandler(async (req, res) => {
  const filas = req.body as { code: unknown; ingreso: unknown; period: unknown }[];
  if (!Array.isArray(filas) || filas.length === 0) {
    res.status(400).json({ error: 'El cuerpo debe ser un array con al menos un registro' }); return;
  }
  const email = req.user?.email ?? null;
  const resultados: { insertados: number; actualizados: number; errores: { fila: unknown; motivo: string }[] } = {
    insertados: 0, actualizados: 0, errores: [],
  };
  for (const fila of filas) {
    const { code, ingreso, period } = fila;
    if (!code || ingreso === undefined || !period) {
      resultados.errores.push({ fila, motivo: 'Faltan campos requeridos (code, ingreso, period)' }); continue;
    }
    const partes = String(period).split('/');
    if (partes.length !== 3) {
      resultados.errores.push({ fila, motivo: 'Formato de fecha inválido, se espera DD/MM/YYYY' }); continue;
    }
    const mes = parseInt(partes[1], 10);
    const anio = parseInt(partes[2], 10);
    if (!mes || !anio || mes < 1 || mes > 12) {
      resultados.errores.push({ fila, motivo: 'Fecha inválida' }); continue;
    }
    if (Number(ingreso) < 0) {
      resultados.errores.push({ fila, motivo: 'El ingreso no puede ser negativo' }); continue;
    }
    const proyecto = await repo.findProjectByCode(String(code));
    if (!proyecto) {
      resultados.errores.push({ fila, motivo: `Proyecto con código "${code}" no encontrado o inactivo` }); continue;
    }
    const periodo = await repo.findPeriodByMonthYear(mes, anio);
    if (!periodo) {
      resultados.errores.push({ fila, motivo: `Período ${mes}/${anio} no existe en el sistema` }); continue;
    }
    const esNuevo = await repo.upsertRevenue(proyecto.id, periodo.id, Number(ingreso), email);
    if (esNuevo) resultados.insertados++; else resultados.actualizados++;
  }
  res.json(resultados);
}));

router.post('/', asyncHandler(async (req, res) => {
  const { proyecto_id, periodo_id, monto } = req.body as Record<string, unknown>;
  if (!proyecto_id || !periodo_id || monto === undefined || monto === null) {
    res.status(400).json({ error: 'proyecto_id, periodo_id y monto son requeridos' }); return;
  }
  if (Number(monto) < 0) { res.status(400).json({ error: 'El monto no puede ser negativo' }); return; }
  const created = await repo.create(
    { project_id: String(proyecto_id), period_id: String(periodo_id), amount: Number(monto) },
    req.user?.email ?? null,
  );
  res.status(201).json(created);
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const { monto } = req.body as Record<string, unknown>;
  if (monto === undefined || monto === null) { res.status(400).json({ error: 'monto es requerido' }); return; }
  if (Number(monto) < 0) { res.status(400).json({ error: 'El monto no puede ser negativo' }); return; }
  const updated = await repo.update(req.params['id'] as string, Number(monto), req.user?.email ?? null);
  if (!updated) { res.status(404).json({ error: 'Ingreso no encontrado' }); return; }
  res.json(updated);
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const ok = await repo.remove(req.params['id'] as string);
  if (!ok) { res.status(404).json({ error: 'Ingreso no encontrado' }); return; }
  res.json({ ok: true });
}));

export default router;
