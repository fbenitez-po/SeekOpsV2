import { AppError } from '../../shared/http/errorHandler';
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
  if (!client) throw new AppError('Cliente no encontrado', 404);

  const projects = await repo.findProjectsByClientId(id);
  return mapper.toClientDetail(client, projects);
}

export async function create(data: CreateClientInput, createdBy: string | null) {
  if (await repo.existsByRuc(data.ruc)) {
    throw new AppError('El RUC ya está registrado en otro cliente', 400);
  }
  const client = await repo.create(data, createdBy);
  return mapper.toClientCreated(client);
}

export async function update(id: string, data: UpdateClientInput, updatedBy: string | null) {
  const exists = await repo.findById(id);
  if (!exists) throw new AppError('Cliente no encontrado', 404);

  if (data.ruc && (await repo.existsByRuc(data.ruc, id))) {
    throw new AppError('El RUC ya está en uso por otro cliente', 400);
  }

  const updated = await repo.update(id, data, updatedBy);
  return mapper.toUpdateResult(updated);
}

export async function toggleActive(id: string, updatedBy: string | null) {
  const exists = await repo.findById(id);
  if (!exists) throw new AppError('Cliente no encontrado', 404);

  const result = await repo.toggleActive(id, updatedBy);
  return mapper.toToggleResult(result!);
}
