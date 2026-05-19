import { AppError } from '../../shared/http/errorHandler';
import * as repo from './projects.repository';
import * as mapper from './projects.mapper';
import type { CreateProjectInput, UpdateProjectInput, AssignUsersInput, ListProjectsQuery } from './projects.schema';

export async function list(query: ListProjectsQuery, userId: string, roles: string[]) {
  const { projects, total, limit, page } = await repo.findAll(query, userId, roles);
  return {
    data: projects.map((p) => mapper.toProjectListItem(p as Parameters<typeof mapper.toProjectListItem>[0])),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

export async function getById(id: string, userId: string, roles: string[]) {
  const project = await repo.findById(id);
  if (!project) throw new AppError('Proyecto no encontrado', 404);

  if (!roles.includes('ADMIN')) {
    const hasAccess = project.project_user?.some((pu) => pu.users.id === userId) || project.manager_id === userId;
    if (!hasAccess) throw new AppError('No tenés acceso a este proyecto', 403);
  }

  return mapper.toProjectDetail(project as Parameters<typeof mapper.toProjectDetail>[0]);
}

export async function create(data: CreateProjectInput, createdBy: string | null) {
  if (await repo.existsByCode(data.codigo)) {
    throw new AppError('El código de proyecto ya existe', 400);
  }
  if (data.fecha_inicio && data.fecha_fin && new Date(data.fecha_fin) < new Date(data.fecha_inicio)) {
    throw new AppError('fecha_fin no puede ser anterior a fecha_inicio', 400);
  }
  if (!(await repo.managerHasGestorRole(data.gestor_id))) {
    throw new AppError('El gestor indicado no tiene rol de Gestor activo', 400);
  }

  const project = await repo.create(data, createdBy);
  return mapper.toProjectCreated(project);
}

export async function update(id: string, data: UpdateProjectInput, updatedBy: string | null) {
  const existing = await repo.findById(id);
  if (!existing) throw new AppError('Proyecto no encontrado', 404);

  if (data.codigo && (await repo.existsByCode(data.codigo, id))) {
    throw new AppError('El código de proyecto ya existe', 400);
  }

  const fechaInicio = data.fecha_inicio ?? existing.start_date?.toISOString().split('T')[0] ?? null;
  const fechaFin = data.fecha_fin ?? existing.end_date?.toISOString().split('T')[0] ?? null;
  if (fechaInicio && fechaFin && new Date(fechaFin) < new Date(fechaInicio)) {
    throw new AppError('fecha_fin no puede ser anterior a fecha_inicio', 400);
  }

  const updated = await repo.update(id, data, updatedBy);
  return mapper.toProjectDetail(updated as Parameters<typeof mapper.toProjectDetail>[0]);
}

export async function toggleActive(id: string, updatedBy: string | null) {
  const exists = await repo.findById(id);
  if (!exists) throw new AppError('Proyecto no encontrado', 404);

  const result = await repo.toggleActive(id, updatedBy);
  return mapper.toToggleResult(result!);
}

export async function assignUsers(id: string, usuarios: AssignUsersInput['usuarios']) {
  const exists = await repo.findById(id);
  if (!exists) throw new AppError('Proyecto no encontrado', 404);

  const result = await repo.assignUsers(id, usuarios.map((u) => ({ usuario_id: u.usuario_id, rol: u.rol })));
  return { proyecto_id: id, ...result };
}

export async function removeUser(projectId: string, userId: string) {
  const removed = await repo.removeUser(projectId, userId);
  if (!removed) throw new AppError('El usuario no está asignado a este proyecto', 404);
}
