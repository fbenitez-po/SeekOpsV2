import { NotFoundError } from '../../../shared/http/errorHandler';
import { logger } from '../../../shared/logging/logger';
import * as repo from './revenues.repository';
import type {
  CreateRevenueInput,
  ImportRevenueRow,
  ListRevenuesQuery,
  UpdateRevenueInput,
} from './revenues.schema';

export async function list(query: ListRevenuesQuery) {
  return repo.findAll(query.periodo_id);
}

export async function create(data: CreateRevenueInput, email: string | null) {
  const revenue = await repo.create(
    { project_id: data.proyecto_id, period_id: data.periodo_id, amount: data.monto },
    email,
  );
  logger.info(
    { actor: email, proyecto_id: data.proyecto_id, periodo_id: data.periodo_id },
    'revenue created',
  );
  return revenue;
}

export async function update(id: string, data: UpdateRevenueInput, email: string | null) {
  const updated = await repo.update(id, data.monto, email);
  if (!updated) throw new NotFoundError('Ingreso no encontrado');
  return updated;
}

export async function remove(id: string) {
  const ok = await repo.remove(id);
  if (!ok) throw new NotFoundError('Ingreso no encontrado');
  return { ok: true };
}

export interface ImportResult {
  insertados: number;
  actualizados: number;
  errores: { fila: unknown; motivo: string }[];
}

export async function importBatch(filas: ImportRevenueRow[], email: string | null): Promise<ImportResult> {
  const resultados: ImportResult = { insertados: 0, actualizados: 0, errores: [] };

  for (const fila of filas) {
    const { code, ingreso, period } = fila;
    if (!code || ingreso === undefined || ingreso === null || !period) {
      resultados.errores.push({ fila, motivo: 'Faltan campos requeridos (code, ingreso, period)' });
      continue;
    }

    const partes = String(period).split('/');
    if (partes.length !== 3) {
      resultados.errores.push({ fila, motivo: 'Formato de fecha inválido, se espera DD/MM/YYYY' });
      continue;
    }

    const mes = parseInt(partes[1]!, 10);
    const anio = parseInt(partes[2]!, 10);
    if (!mes || !anio || mes < 1 || mes > 12) {
      resultados.errores.push({ fila, motivo: 'Fecha inválida' });
      continue;
    }

    const monto = Number(ingreso);
    if (Number.isNaN(monto) || monto < 0) {
      resultados.errores.push({ fila, motivo: 'El ingreso no puede ser negativo' });
      continue;
    }

    const proyecto = await repo.findProjectByCode(String(code));
    if (!proyecto) {
      resultados.errores.push({ fila, motivo: `Proyecto con código "${String(code)}" no encontrado o inactivo` });
      continue;
    }

    const periodo = await repo.findPeriodByMonthYear(mes, anio);
    if (!periodo) {
      resultados.errores.push({ fila, motivo: `Período ${mes}/${anio} no existe en el sistema` });
      continue;
    }

    const esNuevo = await repo.upsertRevenue(proyecto.id, periodo.id, monto, email);
    if (esNuevo) resultados.insertados++;
    else resultados.actualizados++;
  }

  logger.info(
    { actor: email, insertados: resultados.insertados, actualizados: resultados.actualizados, errores: resultados.errores.length },
    'revenues imported',
  );
  return resultados;
}
