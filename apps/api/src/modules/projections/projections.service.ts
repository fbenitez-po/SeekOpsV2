import { ForbiddenError, NotFoundError, ValidationError } from '../../shared/http/errorHandler';
import * as repo from './projections.repository';
import * as mapper from './projections.mapper';
import type { CreateProjectionInput, UpdateProjectionInput } from './projections.schema';

export async function list(filters: Record<string, string>, userId: string, roles: string[]) {
  const rows = await repo.findAll(
    { proyecto_id: filters['proyecto_id'], usuario_id: filters['usuario_id'] },
    userId,
    roles,
  );
  return { data: rows.map(mapper.toProjectionItem) };
}

export async function create(body: CreateProjectionInput, userId: string, email: string | null, roles: string[]) {
  if (new Date(body.fecha_fin) < new Date(body.fecha_inicio)) {
    throw new ValidationError('fecha_fin debe ser mayor o igual a fecha_inicio');
  }

  if (!roles.includes('ADMIN')) {
    const managerId = await repo.findProjectManagerId(body.project_id);
    if (!managerId || managerId !== userId) {
      throw new ForbiddenError('No tenés permisos para proyectar horas en este proyecto');
    }
  }

  const created = await repo.create(body, email);
  return mapper.toProjectionItem(created);
}

export async function update(
  id: string,
  body: UpdateProjectionInput,
  userId: string,
  email: string | null,
  roles: string[],
) {
  const existing = await repo.findById(id);
  if (!existing) throw new NotFoundError('Proyección no encontrada');

  if (!roles.includes('ADMIN') && existing.projects.manager_id !== userId) {
    throw new ForbiddenError('No tenés permisos para modificar esta proyección');
  }

  if (body.fecha_inicio && body.fecha_fin && new Date(body.fecha_fin) < new Date(body.fecha_inicio)) {
    throw new ValidationError('fecha_fin debe ser mayor o igual a fecha_inicio');
  }

  const updated = await repo.update(id, body, email);
  return mapper.toProjectionItem(updated);
}

export async function remove(id: string, userId: string, roles: string[]) {
  const existing = await repo.findById(id);
  if (!existing) throw new NotFoundError('Proyección no encontrada');

  if (!roles.includes('ADMIN') && existing.projects.manager_id !== userId) {
    throw new ForbiddenError('No tenés permisos para eliminar esta proyección');
  }

  await repo.remove(id);
  return { message: 'Proyección eliminada correctamente' };
}

export async function listAlerts(userId: string, roles: string[]) {
  const rows = await repo.findAlerts(userId, roles);
  return { data: mapper.toAlertList(rows) };
}
