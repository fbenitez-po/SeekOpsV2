import { NotFoundError, ValidationError } from '../../shared/http/errorHandler';
import { logger } from '../../shared/logging/logger';
import * as repo from './clients.repository';
import * as mapper from './clients.mapper';
import type { CreateClientInput, UpdateClientInput, ListClientsQuery } from './clients.schema';

export async function list(query: ListClientsQuery) {
  const { clients, total, limit, page } = await repo.findAll(query);
  return {
    data: clients.map((c) => mapper.toClientListItem(c as Parameters<typeof mapper.toClientListItem>[0])),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

export async function getById(id: string) {
  const client = await repo.findById(id);
  if (!client) throw new NotFoundError('Cliente no encontrado');

  const projects = await repo.findProjectsByClientId(id);
  return mapper.toClientDetail(client, projects);
}

export async function create(data: CreateClientInput, createdBy: string | null) {
  if (await repo.existsByRuc(data.ruc)) {
    throw new ValidationError('El RUC ya está registrado en otro cliente');
  }
  const client = await repo.create(data, createdBy);
  logger.info({ actor: createdBy, client_id: client.id }, 'client created');
  return mapper.toClientCreated(client);
}

export async function update(id: string, data: UpdateClientInput, updatedBy: string | null) {
  const exists = await repo.findById(id);
  if (!exists) throw new NotFoundError('Cliente no encontrado');

  if (data.ruc && (await repo.existsByRuc(data.ruc, id))) {
    throw new ValidationError('El RUC ya está en uso por otro cliente');
  }

  const updated = await repo.update(id, data, updatedBy);
  logger.info({ actor: updatedBy, client_id: id }, 'client updated');
  return mapper.toUpdateResult(updated);
}

export async function toggleActive(id: string, updatedBy: string | null) {
  const exists = await repo.findById(id);
  if (!exists) throw new NotFoundError('Cliente no encontrado');

  const result = await repo.toggleActive(id, updatedBy);
  logger.info({ actor: updatedBy, client_id: id }, 'client active toggled');
  return mapper.toToggleResult(result!);
}
