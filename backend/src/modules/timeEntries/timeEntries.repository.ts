import { prisma } from '../../shared/db/prisma';
import { Prisma } from '../../generated/prisma/client';
import type {
  CreateTimeEntryInput,
  ApproveWithObservationInput,
  RejectInput,
} from './timeEntries.schema';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ApprovalRow {
  id: string;
  accion: string;
  line_id: string | null;
  proyecto_id: string | null;
  proyecto_nombre: string | null;
  comentario: string | null;
  sugerencia_horas: string | null;
  sugerencia_extras: string | null;
  fecha: Date;
  realizado_por_id: string | null;
  nombres: string | null;
  apellidos: string | null;
}

export interface SeekerLoadRow {
  user_id: string;
  nombres: string;
  apellidos: string;
  email: string;
  fecha_ingreso: Date | null;
  mis_proyectos: { id: string; nombre: string }[];
  entradas: { semana_inicio: string; en_mis_proyectos: boolean; proyectos_otros: string[] | null }[];
}

const entryIncludes = {
  users: { select: { id: true, first_name: true, last_name: true } },
  time_entry_lines: {
    include: {
      projects: { select: { id: true, name: true, code: true, manager_id: true } },
      project_categories: { select: { id: true, name: true } },
    },
  },
} as const;

export type EntryWithRelations = Prisma.time_entriesGetPayload<{ include: typeof entryIncludes }>;

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function findAll(
  filters: { estado?: string; semana_inicio?: string; usuario_id?: string; proyecto_id?: string },
  userId: string,
  roles: string[],
  limit: number,
  page: number,
): Promise<{ entries: EntryWithRelations[]; total: number }> {
  const where: Prisma.time_entriesWhereInput = {};

  if (roles.includes('ADMIN')) {
    if (filters.usuario_id) where.user_id = filters.usuario_id;
  } else if (roles.includes('GESTOR')) {
    where.OR = [
      { user_id: userId },
      {
        time_entry_lines: {
          some: {
            is_active: true,
            projects: { manager_id: userId },
            time_entry_approvals: { status: 'PENDIENTE' },
          },
        },
      },
    ];
  } else {
    where.user_id = userId;
  }

  if (filters.estado) {
    if (roles.includes('GESTOR') && !roles.includes('ADMIN')) {
      where.time_entry_lines = {
        some: {
          is_active: true,
          projects: { manager_id: userId },
          time_entry_approvals: { status: filters.estado },
        },
      };
    } else {
      where.time_entry_lines = {
        some: {
          is_active: true,
          time_entry_approvals: { status: filters.estado },
        },
      };
    }
  }

  if (filters.semana_inicio) where.week_start_date = new Date(`${filters.semana_inicio}T00:00:00Z`);
  if (filters.proyecto_id) {
    where.time_entry_lines = { some: { project_id: filters.proyecto_id } };
  }

  const skip = (page - 1) * limit;

  const [entries, total] = await Promise.all([
    prisma.time_entries.findMany({
      where,
      include: entryIncludes,
      orderBy: { created_at: 'desc' },
      skip,
      take: limit,
    }),
    prisma.time_entries.count({ where }),
  ]);

  return { entries, total };
}

export async function findById(id: string): Promise<EntryWithRelations | null> {
  return prisma.time_entries.findUnique({ where: { id }, include: entryIncludes });
}

export async function findApprovals(timeEntryId: string): Promise<ApprovalRow[]> {
  return prisma.$queryRaw<ApprovalRow[]>`
    SELECT tea.id,
           tea.status         AS accion,
           tea.time_entry_line_id AS line_id,
           tel.project_id     AS proyecto_id,
           p.name             AS proyecto_nombre,
           tea.comment        AS comentario,
           tea.suggested_hours AS sugerencia_horas,
           tea.suggested_extra_hours AS sugerencia_extras,
           tea.created_at     AS fecha,
           u.id               AS realizado_por_id,
           u.first_name       AS nombres,
           u.last_name        AS apellidos
    FROM time_entry_approvals tea
    JOIN time_entry_lines tel ON tel.id = tea.time_entry_line_id
    LEFT JOIN users u ON u.email = tea.reviewed_by
    JOIN projects p ON p.id = tel.project_id
    WHERE tel.time_entry_id = ${timeEntryId}
    ORDER BY tea.created_at ASC
  `;
}

export async function getLinesForProject(
  timeEntryId: string,
  lineaId: string,
): Promise<{ id: string; status: string; hours: any; extra_hours: any }[]> {
  const lines = await prisma.time_entry_lines.findMany({
    where: {
      time_entry_id: timeEntryId,
      id: lineaId,
      is_active: true,
    },
    select: {
      id: true,
      hours: true,
      extra_hours: true,
      time_entry_approvals: { select: { status: true } },
    },
  });
  return lines.map((l) => ({
    id: l.id,
    status: l.time_entry_approvals?.status ?? 'PENDIENTE',
    hours: l.hours,
    extra_hours: l.extra_hours,
  }));
}

export async function isProjectManager(userId: string, projectId: string): Promise<boolean> {
  return (await prisma.projects.count({ where: { id: projectId, manager_id: userId } })) > 0;
}

export async function isUserAssignedToProject(userId: string, projectId: string): Promise<boolean> {
  const [inProject, isManager] = await Promise.all([
    prisma.project_user.count({ where: { user_id: userId, project_id: projectId } }),
    prisma.projects.count({ where: { id: projectId, manager_id: userId } }),
  ]);
  return inProject > 0 || isManager > 0;
}

/**
 * Returns existing active line for (userId, weekStart, projectId, categoryId) whose approval
 * is NOT RECHAZADO. Returns null if no such line exists (re-load allowed).
 */
export async function findExistingLineForProject(
  userId: string,
  weekStart: Date,
  projectId: string,
  categoryId: string | null,
): Promise<{ id: string; status: string } | null> {
  const entry = await prisma.time_entries.findFirst({
    where: { user_id: userId, week_start_date: weekStart },
    select: { id: true },
  });
  if (!entry) return null;

  const line = await prisma.time_entry_lines.findFirst({
    where: {
      time_entry_id: entry.id,
      project_id: projectId,
      income_category_id: categoryId ?? null,
      is_active: true,
    },
    select: {
      id: true,
      time_entry_approvals: { select: { status: true } },
    },
  });
  if (!line) return null;
  const status = line.time_entry_approvals?.status ?? 'PENDIENTE';
  if (status === 'RECHAZADO') return null;
  return { id: line.id, status };
}

export async function findOrCreateEntry(
  userId: string,
  email: string | null,
  weekStart: Date,
  weekEnd: Date,
): Promise<string> {
  const existing = await prisma.time_entries.findFirst({
    where: { user_id: userId, week_start_date: weekStart },
    select: { id: true },
  });
  if (existing) return existing.id;

  const created = await prisma.time_entries.create({
    data: {
      user_id: userId,
      week_start_date: weekStart,
      week_end_date: weekEnd,
      created_by: email ?? 'admin',
      updated_by: email,
    },
    select: { id: true },
  });
  return created.id;
}

export async function create(
  params: {
    userId: string;
    email: string | null;
    weekStart: Date;
    weekEnd: Date;
    lineas: CreateTimeEntryInput['lineas'];
  },
): Promise<EntryWithRelations> {
  const entryId = await findOrCreateEntry(params.userId, params.email, params.weekStart, params.weekEnd);

  const createdLines = await prisma.time_entry_lines.createManyAndReturn({
    data: params.lineas.map((l) => ({
      time_entry_id: entryId,
      project_id: l.proyecto_id,
      income_category_id: l.categoria_ingreso_id ?? null,
      hours: l.horas,
      extra_hours: l.horas_extra ?? 0,
      comment: l.comentario ?? '',
      created_by: params.email ?? 'admin',
    })),
    select: { id: true, project_id: true },
  });

  await prisma.time_entry_approvals.createMany({
    data: createdLines.map((line) => ({
      time_entry_line_id: line.id,
      status: 'PENDIENTE',
      created_by: params.email ?? 'admin',
    })),
  });

  return (await findById(entryId))!;
}

export async function recordApproval(params: {
  lineaId: string;
  action: 'APROBAR' | 'APROBAR_CON_OBSERVACION' | 'RECHAZAR';
  email: string | null;
  data: Partial<ApproveWithObservationInput & RejectInput>;
}): Promise<string> {
  const statusMap: Record<string, string> = {
    APROBAR: 'APROBADO',
    APROBAR_CON_OBSERVACION: 'APROBADO_CON_OBSERVACION',
    RECHAZAR: 'RECHAZADO',
  };
  const newStatus = statusMap[params.action];
  const observeData = params.data as ApproveWithObservationInput;
  const rejectData = params.data as RejectInput;

  await prisma.time_entry_approvals.update({
    where: { time_entry_line_id: params.lineaId },
    data: {
      status: newStatus,
      reviewed_by: params.email ?? 'admin',
      reviewed_at: new Date(),
      comment: observeData.comentario_observacion ?? rejectData.razon_rechazo ?? null,
      suggested_hours: params.action === 'APROBAR_CON_OBSERVACION' ? (observeData.sugerencia_horas ?? null) : null,
      suggested_extra_hours: params.action === 'APROBAR_CON_OBSERVACION' ? (observeData.sugerencia_extras ?? null) : null,
    },
  });

  return newStatus;
}

export async function getUserHireDate(userId: string): Promise<Date | null> {
  const u = await prisma.users.findUnique({ where: { id: userId }, select: { hire_date: true } });
  return u?.hire_date ?? null;
}

export async function findLoadedWeeks(userId: string): Promise<string[]> {
  const rows = await prisma.time_entries.findMany({
    where: { user_id: userId },
    select: { week_start_date: true },
    distinct: ['week_start_date'],
  });
  return rows.map((r) => r.week_start_date.toISOString().slice(0, 10));
}

export async function findSeekersWithLoadData(managerId: string): Promise<SeekerLoadRow[]> {
  return prisma.$queryRaw<SeekerLoadRow[]>`
    SELECT
      u.id             AS user_id,
      u.first_name     AS nombres,
      u.last_name      AS apellidos,
      u.email,
      u.hire_date      AS fecha_ingreso,
      COALESCE(
        (SELECT json_agg(json_build_object('id', p3.id, 'nombre', p3.name))
         FROM projects p3
         JOIN project_user pu3 ON pu3.project_id = p3.id
         WHERE p3.manager_id = ${managerId}
           AND pu3.user_id = u.id
           AND pu3.is_active = true
           AND pu3.role = 'SEEKER'),
        '[]'::json
      ) AS mis_proyectos,
      COALESCE(
        json_agg(
          json_build_object(
            'semana_inicio', te.week_start_date,
            'en_mis_proyectos', EXISTS(
              SELECT 1 FROM time_entry_lines tel
              JOIN projects p2 ON p2.id = tel.project_id
              JOIN time_entry_approvals tea2 ON tea2.time_entry_line_id = tel.id
              WHERE tel.time_entry_id = te.id
                AND p2.manager_id = ${managerId}
                AND tel.is_active = true
                AND tea2.status != 'RECHAZADO'
            ),
            'proyectos_otros', (
              SELECT json_agg(p_o.name ORDER BY p_o.name)
              FROM time_entry_lines tel_o
              JOIN projects p_o ON p_o.id = tel_o.project_id
              WHERE tel_o.time_entry_id = te.id AND p_o.manager_id != ${managerId}
            )
          )
        ) FILTER (WHERE te.id IS NOT NULL),
        '[]'::json
      ) AS entradas
    FROM (
      SELECT DISTINCT pu.user_id
      FROM projects p
      JOIN project_user pu ON pu.project_id = p.id
      WHERE p.manager_id = ${managerId} AND pu.is_active = true AND pu.role = 'SEEKER'
    ) seekers
    JOIN users u ON u.id = seekers.user_id AND u.id != ${managerId}
    LEFT JOIN time_entries te ON te.user_id = u.id
    GROUP BY u.id, u.first_name, u.last_name, u.email, u.hire_date
  `;
}

export async function findSeekerOfManager(
  managerId: string,
  seekerId: string,
): Promise<{ nombres: string; apellidos: string; email: string; gestor_nombres: string; gestor_apellidos: string } | null> {
  const rows = await prisma.$queryRaw<
    { nombres: string; apellidos: string; email: string; gestor_nombres: string; gestor_apellidos: string }[]
  >`
    SELECT u.first_name AS nombres, u.last_name AS apellidos, u.email,
           g.first_name AS gestor_nombres, g.last_name AS gestor_apellidos
    FROM projects p
    JOIN project_user pu ON pu.project_id = p.id
    JOIN users u ON u.id = pu.user_id
    JOIN users g ON g.id = ${managerId}
    WHERE p.manager_id = ${managerId}
      AND pu.user_id = ${seekerId}
      AND pu.is_active = true
      AND pu.role = 'SEEKER'
    LIMIT 1
  `;
  return rows[0] ?? null;
}
