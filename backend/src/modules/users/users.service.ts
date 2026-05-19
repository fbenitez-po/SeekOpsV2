import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../../shared/http/errorHandler';
import * as repo from './users.repository';
import * as mapper from './users.mapper';
import type { CreateUserInput, UpdateUserInput, ListUsersQuery } from './users.schema';

import { sendWelcome } from '../../shared/services/email.service';

export async function list(query: ListUsersQuery) {
  const { users, total, limit, page } = await repo.findAll(query);
  return {
    data: users.map((u) => mapper.toUserListItem(u as Parameters<typeof mapper.toUserListItem>[0])),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

export async function getById(id: string) {
  const user = await repo.findById(id);
  if (!user) throw new AppError('Usuario no encontrado', 404);
  return mapper.toUserDetail(user as Parameters<typeof mapper.toUserDetail>[0]);
}

export async function create(data: CreateUserInput) {
  if (await repo.existsByEmail(data.email)) {
    throw new AppError('El email ya está registrado en el sistema', 400);
  }
  if (await repo.existsByDocument(data.numero_documento)) {
    throw new AppError('El número de documento ya está registrado', 400);
  }

  const hireDate = new Date(data.fecha_ingreso);
  if (hireDate > new Date()) {
    throw new AppError('La fecha de ingreso no puede ser una fecha futura', 400);
  }

  const user = await repo.create(data);

  const token = uuidv4();
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
  await repo.saveResetToken(user.id, token, expiresAt);
  await sendWelcome(user.email, user.first_name, token);

  return mapper.toUserCreated(user);
}

export async function update(id: string, data: UpdateUserInput) {
  const exists = await repo.findById(id);
  if (!exists) throw new AppError('Usuario no encontrado', 404);

  if (data.numero_documento && (await repo.existsByDocument(data.numero_documento, id))) {
    throw new AppError('El número de documento ya está en uso por otro usuario', 400);
  }
  if (data.areas !== undefined && data.areas.length === 0) {
    throw new AppError('Debe seleccionar al menos un área', 400);
  }

  const updated = await repo.update(id, data);
  return mapper.toUserListItem(updated as Parameters<typeof mapper.toUserListItem>[0]);
}

export async function toggleActive(id: string, updatedBy: string | null) {
  const exists = await repo.findById(id);
  if (!exists) throw new AppError('Usuario no encontrado', 404);

  const result = await repo.toggleActive(id, updatedBy);
  return mapper.toToggleResult(result!);
}
