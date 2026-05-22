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
  proyecto_id: string | null;
  proyecto_nombre: string | null;
  comentario: string | null;
  sugerencia_horas: string | null;
  sugerencia_extras: string | null;
  razon_rechazo: string | null;
  permitir_reenvio: boolean | null;
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
  entradas: { semana: string; en_mis_proyectos: boolean; proyectos_otros: string[] | null }[];
}

const entryIncludes = {
  users: { select: { id: true, first_name: true, last_name: true } },
  time_entry_lines: {
    include: {
      projects: { select: { id: true, name: true, code: true, manager_id: true } },
      income_categories: { select: { id: true, name: true } },
    },
  },
} as const;

export type EntryWithRelations = Prisma.time_entriesGetPayload<{ include: typeof entryIncludes }>;

// ─── Rollup helper ────────────────────────────────────────────────────────────

export function computeWeekRollup(lines: { status: string; is_active: boolean }[]): string {
  const active = lines.filter((l) => l.is_active);
  if (active.length === 0) return 'PENDIENTE';
  if (active.some((l) => l.status === 'PENDIENTE')) return 'PENDIENTE';
  if (active.some((l) => l.status === 'RECHAZADO')) return 'RECHAZADO';
  if (active.some((l) => l.status === 'APROBADO_CON_OBSERVACION')) return 'APROBADO_CON_OBSERVACION';
  return 'APROBADO';
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function findAll(
  filters: { estado?: string; semana?: string; usuario_id?: string; proyecto_id?: string },
  userId: string,
  roles: string[],
  limit: number,
  page: number,
): Promise<{ entries: EntryWithRelations[]; total: number }> {
  const where: Prisma.time_entriesWhereInput = {};

  if (roles.includes('ADMIN')) {
    if (filters.usuario_id) where.user_id = filters.usuario_id;
  } else if (roles.includes('GESTOR')) {
    // Gestor sees own entries OR entries with pending lines in his projects
    where.OR = [
      { user_id: userId },
      {
        time_entry_lines: {
          some: {
            projects: { manager_id: userId },
            status: 'PENDIENTE',
            is_active: true,
          },
        },
      },
    ];
  } else {
    where.user_id = userId;
  }

  // For gestor, filter by line-level status (pending lines in their projects) instead of week rollup
  if (filters.estado) {
    if (roles.includes('GESTOR') && !roles.includes('ADMIN')) {
      // Filter entries that have at least one line matching the status in manager's projects
      where.time_entry_lines = {
        some: {
          projects: { manager_id: userId },
          status: filters.estado,
          is_active: true,
        },
      };
    } else {
      where.status = filters.estado;
    }
  }

  if (filters.semana) where.week = filters.semana;
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
           tea.action         AS accion,
           tea.project_id     AS proyecto_id,
           p.name             AS proyecto_nombre,
           tea.comment        AS comentario,
           tea.suggested_hours AS sugerencia_horas,
           tea.suggested_extra_hours AS sugerencia_extras,
           tea.rejection_reason AS razon_rechazo,
           tea.can_resubmit   AS permitir_reenvio,
           tea.created_at     AS fecha,
           u.id               AS realizado_por_id,
           u.first_name       AS nombres,
           u.last_name        AS apellidos
    FROM time_entry_approvals tea
    LEFT JOIN users u ON u.email = tea.created_by
    LEFT JOIN projects p ON p.id = tea.project_id
    WHERE tea.time_entry_id = ${timeEntryId}
    ORDER BY tea.created_at ASC
  `;
}

export async function getLinesForProject(
  timeEntryId: string,
  projectId: string,
): Promise<{ id: string; status: string; hours: any; extra_hours: any }[]> {
  return prisma.time_entry_lines.findMany({
    where: { time_entry_id: timeEntryId, project_id: projectId, is_active: true },
    select: { id: true, status: true, hours: true, extra_hours: true },
  });
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
 * Returns existing line for (userId, week, projectId) that is active and NOT rejected.
 * If only rejected lines exist, returns null (re-load allowed).
 */
export async function findExistingLineForProject(
  userId: string,
  week: string,
  projectId: string,
): Promise<{ id: string; status: string } | null> {
  const entry = await prisma.time_entries.findFirst({
    where: { user_id: userId, week },
    select: { id: true },
  });
  if (!entry) return null;

  const line = await prisma.time_entry_lines.findFirst({
    where: {
      time_entry_id: entry.id,
      project_id: projectId,
      is_active: true,
      status: { not: 'RECHAZADO' },
    },
    select: { id: true, status: true },
  });
  return line ?? null;
}

export async function findOrCreateEntry(
  userId: string,
  email: string | null,
  week: string,
): Promise<string> {
  const existing = await prisma.time_entries.findFirst({
    where: { user_id: userId, week },
    select: { id: true },
  });
  if (existing) return existing.id;

  const created = await prisma.time_entries.create({
    data: {
      user_id: userId,
      week,
      status: 'PENDIENTE',
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
    week: string;
    lineas: CreateTimeEntryInput['lineas'];
  },
): Promise<EntryWithRelations> {
  const entryId = await findOrCreateEntry(params.userId, params.email, params.week);

  await prisma.time_entry_lines.createMany({
    data: params.lineas.map((l) => ({
      time_entry_id: entryId,
      project_id: l.proyecto_id,
      income_category_id: l.categoria_ingreso_id ?? null,
      hours: l.horas,
      extra_hours: l.horas_extra ?? 0,
      comment: l.comentario ?? '',
      status: 'PENDIENTE',
      created_by: params.email ?? 'admin',
    })),
  });

  // Recalculate rollup
  await recalculateEntryStatus(entryId);

  return (await findById(entryId))!;
}

export async function recordApproval(params: {
  entryId: string;
  projectId: string;
  action: 'APROBAR' | 'APROBAR_CON_OBSERVACION' | 'RECHAZAR';
  email: string | null;
  data: Partial<ApproveWithObservationInput & RejectInput>;
}): Promise<string> {
  const statusMap: Record<string, string> = {
    APROBAR: 'APROBADO',
    APROBAR_CON_OBSERVACION: 'APROBADO_CON_OBSERVACION',
    RECHAZAR: 'RECHAZADO',
  };
  const newLineStatus = statusMap[params.action];

  await prisma.$transaction(async (tx) => {
    const observeData = params.data as ApproveWithObservationInput;
    const rejectData = params.data as RejectInput;

    // If observe with line adjustments, apply them (only to PENDIENTE lines of this project)
    if (params.action === 'APROBAR_CON_OBSERVACION' && observeData.lineas?.length) {
      for (const l of observeData.lineas) {
        await tx.time_entry_lines.updateMany({
          where: {
            id: l.id,
            time_entry_id: params.entryId,
            project_id: params.projectId,
            status: 'PENDIENTE',
          },
          data: { hours: l.horas, extra_hours: l.horas_extra ?? 0, updated_at: new Date() },
        });
      }
    }

    // Update status on all active lines of this project in this entry
    await tx.time_entry_lines.updateMany({
      where: {
        time_entry_id: params.entryId,
        project_id: params.projectId,
        is_active: true,
        status: 'PENDIENTE',
      },
      data: {
        status: newLineStatus,
        reviewed_by: params.email,
        reviewed_at: new Date(),
        updated_at: new Date(),
        updated_by: params.email,
      },
    });

    // Recalculate rollup for the entry
    const lines = await tx.time_entry_lines.findMany({
      where: { time_entry_id: params.entryId },
      select: { status: true, is_active: true },
    });
    const rollup = computeWeekRollup(lines);
    await tx.time_entries.update({
      where: { id: params.entryId },
      data: { status: rollup, updated_at: new Date(), updated_by: params.email },
    });

    // Record audit entry
    await tx.time_entry_approvals.create({
      data: {
        time_entry_id: params.entryId,
        project_id: params.projectId,
        action: newLineStatus,
        comment: observeData.comentario_observacion ?? rejectData.razon_rechazo ?? null,
        suggested_hours: observeData.sugerencia_horas ?? null,
        suggested_extra_hours: observeData.sugerencia_extras ?? null,
        rejection_reason: rejectData.razon_rechazo ?? null,
        can_resubmit: rejectData.permitir_reenvio ?? false,
        created_by: params.email ?? 'admin',
      },
    });
  });

  return newLineStatus;
}

async function recalculateEntryStatus(entryId: string): Promise<void> {
  const lines = await prisma.time_entry_lines.findMany({
    where: { time_entry_id: entryId },
    select: { status: true, is_active: true },
  });
  const rollup = computeWeekRollup(lines);
  await prisma.time_entries.update({
    where: { id: entryId },
    data: { status: rollup, updated_at: new Date() },
  });
}

export async function getUserHireDate(userId: string): Promise<Date | null> {
  const u = await prisma.users.findUnique({ where: { id: userId }, select: { hire_date: true } });
  return u?.hire_date ?? null;
}

export async function findLoadedWeeks(userId: string): Promise<string[]> {
  const rows = await prisma.time_entries.findMany({
    where: { user_id: userId },
    select: { week: true },
    distinct: ['week'],
  });
  return rows.map((r) => r.week);
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
            'semana', te.week,
            'en_mis_proyectos', EXISTS(
              SELECT 1 FROM time_entry_lines tel
              JOIN projects p2 ON p2.id = tel.project_id
              WHERE tel.time_entry_id = te.id AND p2.manager_id = ${managerId}
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
    LEFT JOIN time_entries te ON te.user_id = u.id AND te.status != 'RECHAZADO'
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
