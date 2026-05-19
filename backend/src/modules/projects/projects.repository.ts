import { prisma } from '../../shared/db/prisma';
import { Prisma } from '../../generated/prisma/client';
import type { CreateProjectInput, UpdateProjectInput, ListProjectsQuery } from './projects.schema';

const projectIncludes = {
  clients: { select: { id: true, legal_name: true, trade_name: true } },
  users: { select: { id: true, first_name: true, last_name: true } },
  project_segmentation: { select: { id: true, name: true } },
  service_types: { select: { id: true, name: true } },
  areas: { select: { id: true, name: true } },
  project_project_category: {
    include: { project_categories: { select: { id: true, name: true } } },
    orderBy: { project_categories: { name: 'asc' as const } },
  },
} as const;

export async function findAll(query: ListProjectsQuery, userId: string, roles: string[]) {
  const limit = Math.min(parseInt(query.limit ?? '20') || 20, 100);
  const page = parseInt(query.page ?? '1') || 1;
  const skip = (page - 1) * limit;

  const where: Prisma.projectsWhereInput = {};

  if (!roles.includes('ADMIN')) {
    if (roles.includes('GESTOR')) {
      where.OR = [
        { project_user: { some: { user_id: userId } } },
        { manager_id: userId },
      ];
    } else {
      where.project_user = { some: { user_id: userId } };
    }
  }

  if (query.activo !== undefined) where.is_active = query.activo === 'true';
  if (query.cliente_id) where.client_id = query.cliente_id;
  if (query.gestor_id) where.manager_id = query.gestor_id;
  if (query.search) {
    const searchOr = [
      { name: { contains: query.search, mode: 'insensitive' as const } },
      { code: { contains: query.search, mode: 'insensitive' as const } },
    ];
    where.OR = where.OR ? [...where.OR, ...searchOr] : searchOr;
  }

  const [projects, total] = await Promise.all([
    prisma.projects.findMany({
      where,
      include: { ...projectIncludes, _count: { select: { project_user: true } } },
      orderBy: { name: 'asc' },
      skip,
      take: limit,
    }),
    prisma.projects.count({ where }),
  ]);

  return { projects, total, limit, page };
}

export async function findById(id: string) {
  return prisma.projects.findUnique({
    where: { id },
    include: {
      ...projectIncludes,
      project_user: {
        include: { users: { select: { id: true, first_name: true, last_name: true, email: true, avatar_url: true } } },
        orderBy: { users: { last_name: 'asc' } },
      },
    },
  });
}

export async function existsByCode(code: string, excludeId?: string) {
  const where: Prisma.projectsWhereInput = { code };
  if (excludeId) where.id = { not: excludeId };
  return (await prisma.projects.count({ where })) > 0;
}

export async function managerHasGestorRole(managerId: string) {
  return (await prisma.user_profile.count({
    where: { user_id: managerId, profiles: { code: 'GESTOR' } },
  })) > 0;
}

export async function create(data: CreateProjectInput, createdBy: string | null) {
  return prisma.$transaction(async (tx) => {
    const project = await tx.projects.create({
      data: {
        code: data.codigo,
        name: data.nombre,
        client_id: data.cliente_id,
        project_segmentation_id: data.segmentacion_id,
        productivity_layer_id: data.capa_productividad_id ?? null,
        service_type_id: data.tipo_servicio_id ?? null,
        manager_id: data.gestor_id,
        area_id: data.area_id ?? null,
        start_date: data.fecha_inicio ? new Date(data.fecha_inicio) : null,
        end_date: data.fecha_fin ? new Date(data.fecha_fin) : null,
        actual_start_date: data.fecha_inicio_real ? new Date(data.fecha_inicio_real) : null,
        actual_end_date: data.fecha_fin_real ? new Date(data.fecha_fin_real) : null,
        is_active: data.activo !== false,
        created_by: createdBy ?? 'admin',
        updated_by: createdBy,
      },
      select: { id: true, code: true, name: true, is_active: true, created_at: true },
    });

    if (data.categorias_proyecto_ids?.length) {
      await tx.project_project_category.createMany({
        data: data.categorias_proyecto_ids.map((catId) => ({
          project_id: project.id,
          project_category_id: catId,
        })),
        skipDuplicates: true,
      });
    }

    return project;
  });
}

export async function update(id: string, data: UpdateProjectInput, updatedBy: string | null) {
  return prisma.$transaction(async (tx) => {
    const patch: Prisma.projectsUpdateInput = { updated_at: new Date(), updated_by: updatedBy };
    if (data.codigo !== undefined) patch.code = data.codigo;
    if (data.nombre !== undefined) patch.name = data.nombre;
    if (data.cliente_id !== undefined) patch.clients = { connect: { id: data.cliente_id } };
    if (data.segmentacion_id !== undefined) patch.project_segmentation = { connect: { id: data.segmentacion_id } };
    if (data.gestor_id !== undefined) patch.users = { connect: { id: data.gestor_id } };
    if (data.capa_productividad_id !== undefined) {
      patch.productivity_layers = data.capa_productividad_id
        ? { connect: { id: data.capa_productividad_id } }
        : { disconnect: true };
    }
    if (data.tipo_servicio_id !== undefined) {
      patch.service_types = data.tipo_servicio_id
        ? { connect: { id: data.tipo_servicio_id } }
        : { disconnect: true };
    }
    if (data.area_id !== undefined) {
      patch.areas = data.area_id ? { connect: { id: data.area_id } } : { disconnect: true };
    }
    if (data.fecha_inicio !== undefined) patch.start_date = data.fecha_inicio ? new Date(data.fecha_inicio) : null;
    if (data.fecha_fin !== undefined) patch.end_date = data.fecha_fin ? new Date(data.fecha_fin) : null;
    if (data.fecha_inicio_real !== undefined) patch.actual_start_date = data.fecha_inicio_real ? new Date(data.fecha_inicio_real) : null;
    if (data.fecha_fin_real !== undefined) patch.actual_end_date = data.fecha_fin_real ? new Date(data.fecha_fin_real) : null;
    if (data.activo !== undefined) patch.is_active = data.activo;

    if (Object.keys(patch).length > 2) {
      await tx.projects.update({ where: { id }, data: patch });
    }

    if (data.categorias_proyecto_ids !== undefined) {
      await tx.project_project_category.deleteMany({ where: { project_id: id } });
      if (data.categorias_proyecto_ids?.length) {
        await tx.project_project_category.createMany({
          data: data.categorias_proyecto_ids.map((catId) => ({
            project_id: id,
            project_category_id: catId,
          })),
          skipDuplicates: true,
        });
      }
    }

    return tx.projects.findUnique({ where: { id }, include: projectIncludes });
  });
}

export async function toggleActive(id: string, updatedBy: string | null) {
  const existing = await prisma.projects.findUnique({ where: { id }, select: { is_active: true } });
  if (!existing) return null;

  return prisma.projects.update({
    where: { id },
    data: {
      is_active: !existing.is_active,
      deleted_at: existing.is_active ? new Date() : null,
      deleted_by: existing.is_active ? updatedBy : null,
      updated_at: new Date(),
      updated_by: updatedBy,
    },
    select: { id: true, is_active: true, updated_at: true },
  });
}

export async function assignUsers(projectId: string, usuarios: { usuario_id: string; rol: string }[]) {
  const assigned: { usuario_id: string; rol: string }[] = [];
  const alreadyExisted: { usuario_id: string; rol: string }[] = [];

  for (const { usuario_id, rol } of usuarios) {
    const exists = await prisma.project_user.findUnique({
      where: { project_id_user_id_role: { project_id: projectId, user_id: usuario_id, role: rol } },
    });
    if (exists) {
      alreadyExisted.push({ usuario_id, rol });
    } else {
      await prisma.project_user.create({ data: { project_id: projectId, user_id: usuario_id, role: rol } });
      assigned.push({ usuario_id, rol });
    }
  }

  return { usuarios_asignados: assigned, ya_existian: alreadyExisted };
}

export async function removeUser(projectId: string, userId: string) {
  const exists = await prisma.project_user.findFirst({ where: { project_id: projectId, user_id: userId } });
  if (!exists) return false;

  await prisma.project_user.deleteMany({ where: { project_id: projectId, user_id: userId } });
  return true;
}
