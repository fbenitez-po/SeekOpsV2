import { NotFoundError } from '../../../shared/http/errorHandler';
import { logger } from '../../../shared/logging/logger';
import * as repo from './personnelCosts.repository';
import type { ListPersonnelCostsQuery, PersonnelCostBody } from './personnelCosts.schema';

function toRepoInput(data: PersonnelCostBody) {
  return {
    period_id: data.periodo_id,
    user_id: data.user_id,
    compensation: data.remuneracion,
    business_days: data.dias_habiles,
    hours_per_day: data.horas_por_dia,
  };
}

export async function list(query: ListPersonnelCostsQuery) {
  return repo.findAll(query.periodo_id);
}

export async function getById(id: string) {
  const item = await repo.findById(id);
  if (!item) throw new NotFoundError('Registro no encontrado');
  return item;
}

export async function create(data: PersonnelCostBody, email: string | null) {
  const cost = await repo.create(toRepoInput(data), email);
  logger.info({ actor: email, periodo_id: data.periodo_id, user_id: data.user_id }, 'personnel cost created');
  return cost;
}

export async function update(id: string, data: PersonnelCostBody, email: string | null) {
  const updated = await repo.update(id, toRepoInput(data), email);
  if (!updated) throw new NotFoundError('Registro no encontrado');
  return updated;
}

export async function remove(id: string) {
  const ok = await repo.remove(id);
  if (!ok) throw new NotFoundError('Registro no encontrado');
  return { ok: true };
}

export async function importBatch(filas: PersonnelCostBody[], email: string | null) {
  let insertados = 0;
  const errores: { fila: number; error: string }[] = [];

  for (let i = 0; i < filas.length; i++) {
    try {
      await repo.upsertImport(toRepoInput(filas[i]!), email);
      insertados++;
    } catch (e) {
      errores.push({ fila: i + 1, error: (e as Error).message });
    }
  }

  logger.info({ actor: email, insertados, errores: errores.length }, 'personnel costs imported');
  return { insertados, errores };
}
