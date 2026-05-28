import { NotFoundError } from '../../../shared/http/errorHandler';
import * as repo from './salesCosts.repository';
import type { SalesCostBody, ListSalesCostsQuery } from './salesCosts.schema';

export async function list(query: ListSalesCostsQuery) {
  return repo.findAll(query.periodo_id);
}

export async function getById(id: string) {
  const item = await repo.findById(id);
  if (!item) throw new NotFoundError('Costo de venta no encontrado');
  return item;
}

export async function create(data: SalesCostBody, email: string | null) {
  return repo.create(
    {
      period_id: data.periodo_id,
      codigo: data.codigo,
      descripcion: data.descripcion ?? null,
      monto: data.monto,
    },
    email,
  );
}

export async function update(id: string, data: SalesCostBody, email: string | null) {
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
  if (!updated) throw new NotFoundError('Costo de venta no encontrado');
  return updated;
}

export async function remove(id: string) {
  const ok = await repo.remove(id);
  if (!ok) throw new NotFoundError('Costo de venta no encontrado');
  return { ok: true };
}
