import { NotFoundError } from '../../shared/http/errorHandler';
import { logger } from '../../shared/logging/logger';
import * as repo from './commercial.repository';
import type { CommercialBody, ListCommercialQuery } from './commercial.schema';

function toRepoInput(data: CommercialBody): repo.CommercialInput {
  return {
    fecha_registro: data.fecha_registro,
    proyecto_id: data.proyecto_id,
    responsable_id: data.responsable_id,
    precio: data.precio,
    detalle: data.detalle ?? null,
    tipo_documento_id: data.tipo_documento_id ?? null,
    estado_contrato: data.estado_contrato,
    facturacion: data.facturacion,
    evidencia_nombre: data.evidencia_nombre ?? null,
  };
}

export async function list(query: ListCommercialQuery) {
  return repo.findAll(query.proyecto_id);
}

export async function getById(id: string) {
  const item = await repo.findById(id);
  if (!item) throw new NotFoundError('Registro no encontrado');
  return item;
}

export async function create(data: CommercialBody, email: string | null) {
  const record = await repo.create(toRepoInput(data), email);
  logger.info({ actor: email, proyecto_id: data.proyecto_id, responsable_id: data.responsable_id }, 'commercial record created');
  return record;
}

export async function update(id: string, data: CommercialBody, email: string | null) {
  const updated = await repo.update(id, toRepoInput(data), email);
  if (!updated) throw new NotFoundError('Registro no encontrado');
  logger.info({ actor: email, commercial_id: id }, 'commercial record updated');
  return updated;
}

export async function remove(id: string) {
  const ok = await repo.remove(id);
  if (!ok) throw new NotFoundError('Registro no encontrado');
  return { ok: true };
}

export async function documentTypes() {
  return repo.findDocumentTypes();
}
