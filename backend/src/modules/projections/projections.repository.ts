import { prisma } from '../../shared/db/prisma';
import { Prisma } from '../../generated/prisma/client';
import type { CreateProjectionInput, UpdateProjectionInput } from './projections.schema';

export interface AlertRow {
  time_entry_id: string;
  semana: string;
  estado: string;
  fecha_carga: Date;
  usuario_id: string;
  usuario_nombres: string;
  usuario_apellidos: string;
  proyecto_id: string;
  proyecto_nombre: string;
  horas_cargadas: number;
}

const projectionIncludes = {
  projects: { select: { id: true, name: true, code: true, manager_id: true } },
  users: { select: { id: true, first_name: true, last_name: true } },
  work_categories: { select: { id: true, name: true } },
} as const;

export type ProjectionWithRelations = Prisma.hour_projectionsGetPayload<{ include: typeof projectionIncludes }>;

export async function findAll(
  filters: { proyecto_id?: string; usuario_id?: string },
  userId: string,
  roles: string[],
): Promise<ProjectionWithRelations[]> {
  const where: Prisma.hour_projectionsWhereInput = {};

  if (!roles.includes('ADMIN')) {
    where.projects = { manager_id: userId };
  }

  if (filters.proyecto_id) where.project_id = filters.proyecto_id;
  if (filters.usuario_id) where.user_id = filters.usuario_id;

  return prisma.hour_projections.findMany({
    where,
    include: projectionIncludes,
    orderBy: [{ start_date: 'desc' }, { projects: { name: 'asc' } }, { users: { last_name: 'asc' } }],
  });
}

export async function findById(id: string): Promise<ProjectionWithRelations | null> {
  return prisma.hour_projections.findUnique({ where: { id }, include: projectionIncludes });
}

export async function findProjectManagerId(projectId: string): Promise<string | null> {
  const p = await prisma.projects.findUnique({ where: { id: projectId }, select: { manager_id: true } });
  return p?.manager_id ?? null;
}

export async function create(data: CreateProjectionInput, email: string | null): Promise<ProjectionWithRelations> {
  const created = await prisma.hour_projections.create({
    data: {
      project_id: data.project_id,
      user_id: data.user_id,
      start_date: new Date(data.fecha_inicio),
      end_date: new Date(data.fecha_fin),
      projected_hours: data.horas_proyectadas,
      notes: data.notas ?? null,
      work_category_id: data.work_category_id ?? null,
      created_by: email ?? 'admin',
      updated_by: email,
    },
    select: { id: true },
  });
  return (await findById(created.id))!;
}

export async function update(
  id: string,
  data: UpdateProjectionInput,
  email: string | null,
): Promise<ProjectionWithRelations> {
  const patch: Prisma.hour_projectionsUpdateInput = { updated_at: new Date(), updated_by: email };

  if (data.fecha_inicio !== undefined) patch.start_date = new Date(data.fecha_inicio);
  if (data.fecha_fin !== undefined) patch.end_date = new Date(data.fecha_fin);
  if (data.horas_proyectadas !== undefined) patch.projected_hours = data.horas_proyectadas;
  if (data.notas !== undefined) patch.notes = data.notas ?? null;
  if (data.work_category_id !== undefined) {
    patch.work_categories = data.work_category_id
      ? { connect: { id: data.work_category_id } }
      : { disconnect: true };
  }

  await prisma.hour_projections.update({ where: { id }, data: patch });
  return (await findById(id))!;
}

export async function remove(id: string): Promise<void> {
  await prisma.hour_projections.delete({ where: { id } });
}

export async function findAlerts(userId: string, roles: string[]): Promise<AlertRow[]> {
  if (roles.includes('ADMIN')) {
    return prisma.$queryRaw<AlertRow[]>`
      SELECT
        te.id           AS time_entry_id,
        te.week         AS semana,
        te.status       AS estado,
        te.created_at   AS fecha_carga,
        u.id            AS usuario_id,
        u.first_name    AS usuario_nombres,
        u.last_name     AS usuario_apellidos,
        p.id            AS proyecto_id,
        p.name          AS proyecto_nombre,
        SUM(tel.hours)  AS horas_cargadas
      FROM time_entries te
      JOIN users u ON u.id = te.user_id
      JOIN time_entry_lines tel ON tel.time_entry_id = te.id
      JOIN projects p ON p.id = tel.project_id
      WHERE te.status <> 'RECHAZADO'
        AND NOT EXISTS (
          SELECT 1 FROM hour_projections hp
          WHERE hp.project_id = tel.project_id
            AND hp.user_id    = te.user_id
            AND hp.start_date <= (to_date(
                (2000 + right(te.week, 2)::int)::text ||
                lpad(split_part(substring(te.week from 2), '/', 1), 3, '0'),
                'IYYYIW'
              ) + 6)
            AND hp.end_date   >= to_date(
                (2000 + right(te.week, 2)::int)::text ||
                lpad(split_part(substring(te.week from 2), '/', 1), 3, '0'),
                'IYYYIW'
              )
        )
      GROUP BY te.id, u.id, p.id
      ORDER BY te.created_at DESC
      LIMIT 50
    `;
  }

  return prisma.$queryRaw<AlertRow[]>`
    SELECT
      te.id           AS time_entry_id,
      te.week         AS semana,
      te.status       AS estado,
      te.created_at   AS fecha_carga,
      u.id            AS usuario_id,
      u.first_name    AS usuario_nombres,
      u.last_name     AS usuario_apellidos,
      p.id            AS proyecto_id,
      p.name          AS proyecto_nombre,
      SUM(tel.hours)  AS horas_cargadas
    FROM time_entries te
    JOIN users u ON u.id = te.user_id
    JOIN time_entry_lines tel ON tel.time_entry_id = te.id
    JOIN projects p ON p.id = tel.project_id
    WHERE te.status <> 'RECHAZADO'
      AND p.manager_id = ${userId}
      AND NOT EXISTS (
        SELECT 1 FROM hour_projections hp
        WHERE hp.project_id = tel.project_id
          AND hp.user_id    = te.user_id
          AND hp.start_date <= (to_date(
              (2000 + right(te.week, 2)::int)::text ||
              lpad(split_part(substring(te.week from 2), '/', 1), 3, '0'),
              'IYYYIW'
            ) + 6)
          AND hp.end_date   >= to_date(
              (2000 + right(te.week, 2)::int)::text ||
              lpad(split_part(substring(te.week from 2), '/', 1), 3, '0'),
              'IYYYIW'
            )
      )
    GROUP BY te.id, u.id, p.id
    ORDER BY te.created_at DESC
    LIMIT 50
  `;
}
