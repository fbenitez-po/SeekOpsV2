import { NotFoundError } from '../../../shared/http/errorHandler';
import { logger } from '../../../shared/logging/logger';
import * as repo from './adminExpenses.repository';
import type { AdminExpenseBody, ListAdminExpensesQuery } from './adminExpenses.schema';

export async function list(query: ListAdminExpensesQuery) {
  return repo.findAll(query.periodo_id);
}

export async function getById(id: string) {
  const item = await repo.findById(id);
  if (!item) throw new NotFoundError('Gasto no encontrado');
  return item;
}

export async function create(data: AdminExpenseBody, email: string | null) {
  const expense = await repo.create(
    {
      period_id: data.periodo_id,
      codigo: data.codigo,
      descripcion: data.descripcion ?? null,
      monto: data.monto,
    },
    email,
  );
  logger.info({ actor: email, periodo_id: data.periodo_id, codigo: data.codigo }, 'admin expense created');
  return expense;
}

export async function update(id: string, data: AdminExpenseBody, email: string | null) {
  const updated = await repo.update(
    id,
    {
      period_id: data.periodo_id,
      codigo: data.codigo,
      descripcion: data.descripcion ?? null,
      monto: data.monto,
    },
    email,
  );
  if (!updated) throw new NotFoundError('Gasto no encontrado');
  return updated;
}

export async function remove(id: string) {
  const ok = await repo.remove(id);
  if (!ok) throw new NotFoundError('Gasto no encontrado');
  return { ok: true };
}
