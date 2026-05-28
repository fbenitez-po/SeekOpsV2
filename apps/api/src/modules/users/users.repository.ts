import { prisma } from '../../shared/db/prisma';
import { Prisma } from '../../generated/prisma/client';
import type { CreateUserInput, UpdateUserInput, ListUsersQuery } from './users.schema';

const userIncludes = {
  teams: { select: { id: true, name: true } },
  user_area: { include: { areas: { select: { id: true, name: true } } } },
  user_profile: { include: { profiles: { select: { code: true } } } },
} as const;

export async function findAll(query: ListUsersQuery) {
  const limit = Math.min(parseInt(query.limit ?? '20') || 20, 100);
  const page = parseInt(query.page ?? '1') || 1;
  const skip = (page - 1) * limit;

  const where: Prisma.usersWhereInput = {};
  if (query.activo !== undefined) where.is_active = query.activo === 'true';
  if (query.equipo_id) where.team_id = query.equipo_id;
  if (query.grupo) where.user_profile = { some: { profiles: { code: query.grupo } } };
  if (query.search) {
    where.OR = [
      { first_name: { contains: query.search, mode: 'insensitive' } },
      { last_name: { contains: query.search, mode: 'insensitive' } },
      { email: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.users.findMany({
      where,
      include: userIncludes,
      orderBy: [{ last_name: 'asc' }, { first_name: 'asc' }],
      skip,
      take: limit,
    }),
    prisma.users.count({ where }),
  ]);

  return { users, total, limit, page };
}

export async function findById(id: string) {
  return prisma.users.findUnique({
    where: { id },
    include: {
      ...userIncludes,
      project_user: {
        include: {
          projects: {
            include: { clients: { select: { legal_name: true, trade_name: true } } },
          },
        },
      },
    },
  });
}

export async function existsByEmail(email: string, excludeId?: string) {
  const where: Prisma.usersWhereInput = { email };
  if (excludeId) where.id = { not: excludeId };
  return (await prisma.users.count({ where })) > 0;
}

export async function existsByDocument(documentNumber: string, excludeId?: string) {
  const where: Prisma.usersWhereInput = { document_number: documentNumber };
  if (excludeId) where.id = { not: excludeId };
  return (await prisma.users.count({ where })) > 0;
}

export async function create(data: CreateUserInput) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.users.create({
      data: {
        email: data.email,
        password_hash: '$placeholder$',
        first_name: data.nombres,
        last_name: data.apellidos,
        document_number: data.numero_documento,
        position: data.puesto,
        mobile_phone: data.celular ?? null,
        avatar_url: data.avatar_url ?? null,
        team_id: data.equipo_id,
        hire_date: new Date(data.fecha_ingreso),
        is_active: data.activo !== false,
        is_staff: data.staff ?? false,
        is_superuser: data.super_usuario ?? false,
      },
      select: { id: true, email: true, first_name: true, last_name: true, is_active: true, created_at: true },
    });

    if (data.areas?.length) {
      await tx.user_area.createMany({
        data: data.areas.map((areaId) => ({ user_id: user.id, area_id: areaId })),
        skipDuplicates: true,
      });
    }

    if (data.grupos?.length) {
      const profiles = await tx.profiles.findMany({ where: { code: { in: data.grupos } }, select: { id: true } });
      if (profiles.length) {
        await tx.user_profile.createMany({
          data: profiles.map((p) => ({ user_id: user.id, profile_id: p.id })),
          skipDuplicates: true,
        });
      }
    }

    return user;
  });
}

export async function saveResetToken(userId: string, token: string, expiresAt: Date) {
  await prisma.password_reset_tokens.upsert({
    where: { user_id: userId },
    create: { user_id: userId, token, expires_at: expiresAt },
    update: { token, expires_at: expiresAt },
  });
}

export async function update(id: string, data: UpdateUserInput) {
  return prisma.$transaction(async (tx) => {
    const patch: Prisma.usersUpdateInput = { updated_at: new Date() };
    if (data.nombres !== undefined) patch.first_name = data.nombres;
    if (data.apellidos !== undefined) patch.last_name = data.apellidos;
    if (data.numero_documento !== undefined) patch.document_number = data.numero_documento;
    if (data.puesto !== undefined) patch.position = data.puesto;
    if (data.celular !== undefined) patch.mobile_phone = data.celular ?? null;
    if (data.avatar_url !== undefined) patch.avatar_url = data.avatar_url ?? null;
    if (data.equipo_id !== undefined) patch.teams = { connect: { id: data.equipo_id } };
    if (data.fecha_ingreso !== undefined) patch.hire_date = new Date(data.fecha_ingreso);
    if (data.activo !== undefined) patch.is_active = data.activo;
    if (data.staff !== undefined) patch.is_staff = data.staff;
    if (data.super_usuario !== undefined) patch.is_superuser = data.super_usuario;

    if (Object.keys(patch).length > 1) {
      await tx.users.update({ where: { id }, data: patch });
    }

    if (data.areas !== undefined) {
      await tx.user_area.deleteMany({ where: { user_id: id } });
      if (data.areas.length) {
        await tx.user_area.createMany({
          data: data.areas.map((areaId) => ({ user_id: id, area_id: areaId })),
          skipDuplicates: true,
        });
      }
    }

    if (data.grupos !== undefined) {
      await tx.user_profile.deleteMany({ where: { user_id: id } });
      if (data.grupos.length) {
        const profiles = await tx.profiles.findMany({ where: { code: { in: data.grupos } }, select: { id: true } });
        if (profiles.length) {
          await tx.user_profile.createMany({
            data: profiles.map((p) => ({ user_id: id, profile_id: p.id })),
            skipDuplicates: true,
          });
        }
      }
    }

    return tx.users.findUnique({ where: { id }, include: userIncludes });
  });
}

export async function toggleActive(id: string, updatedBy: string | null) {
  const existing = await prisma.users.findUnique({ where: { id }, select: { is_active: true } });
  if (!existing) return null;

  return prisma.users.update({
    where: { id },
    data: {
      is_active: !existing.is_active,
      deleted_at: existing.is_active ? new Date() : null,
      deleted_by: existing.is_active ? updatedBy : null,
      updated_at: new Date(),
      updated_by: updatedBy,
    },
    select: { id: true, is_active: true, deleted_at: true },
  });
}
