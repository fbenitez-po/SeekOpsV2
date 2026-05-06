import {prisma} from "../lib/prisma";
import {Prisma} from "@prisma/client";

interface ProjectionFilters {
  projectId?: string;
  userId?: string;
}

interface CreateProjectionData {
  projectId: string;
  userId: string;
  startDate: string | Date;
  endDate: string | Date;
  projectedHours: number;
  notes?: string;
}

interface UpdateProjectionData {
  startDate?: string | Date;
  endDate?: string | Date;
  projectedHours?: number;
  notes?: string;
}

const projectionSelect = {
  id: true,
  projectId: true,
  userId: true,
  startDate: true,
  endDate: true,
  projectedHours: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  project: { select: { name: true, code: true, managerId: true } },
  user: { select: { firstName: true, lastName: true } },
} satisfies Prisma.HourProjectionSelect;

export async function listProjections(
  filters: ProjectionFilters,
  managerId: string,
  roles: string[]
) {
  const where: Prisma.HourProjectionWhereInput = {};

  if (!roles.includes("ADMIN")) {
    where.project = { managerId };
  }
  if (filters.projectId) where.projectId = filters.projectId;
  if (filters.userId) where.userId = filters.userId;

  return prisma.hourProjection.findMany({
    where,
    select: projectionSelect,
    orderBy: [{ startDate: "desc" }, { project: { name: "asc" } }, { user: { lastName: "asc" } }],
  });
}

export async function findProjectionById(id: string) {
  return prisma.hourProjection.findUnique({ where: { id }, select: projectionSelect });
}

export async function createProjection(
  data: CreateProjectionData,
  createdByUserId: string
) {
  return prisma.hourProjection.create({
    data: {
      projectId: data.projectId,
      userId: data.userId,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      projectedHours: data.projectedHours,
      notes: data.notes ?? null,
      createdByUserId,
      updatedByUserId: createdByUserId,
    },
    select: { id: true },
  });
}

export async function updateProjection(
  id: string,
  data: UpdateProjectionData,
  updatedByUserId: string
) {
  return prisma.hourProjection.update({
    where: { id },
    data: {
      ...(data.startDate !== undefined && { startDate: new Date(data.startDate) }),
      ...(data.endDate !== undefined && { endDate: new Date(data.endDate) }),
      ...(data.projectedHours !== undefined && { projectedHours: data.projectedHours }),
      ...(data.notes !== undefined && { notes: data.notes }),
      updatedAt: new Date(),
      updatedByUserId,
    },
    select: { id: true },
  });
}

export async function deleteProjection(id: string) {
  return prisma.hourProjection.delete({ where: { id }, select: { id: true } });
}

// Returns time_entries in manager's projects that have no active projection
export async function listAlerts(managerId: string, roles: string[]) {
  const managerCondition = roles.includes("ADMIN")
    ? Prisma.sql``
    : Prisma.sql`AND p.manager_id = ${managerId}::uuid`;

  type AlertRow = {
    time_entry_id: string;
    week: string;
    status: string;
    created_at: Date;
    user_id: string;
    first_name: string;
    last_name: string;
    project_id: string;
    project_name: string;
    hours_loaded: bigint;
  };

  return prisma.$queryRaw<AlertRow[]>`
    SELECT
      te.id           AS time_entry_id,
      te.week,
      te.status,
      te.created_at,
      u.id            AS user_id,
      u.first_name,
      u.last_name,
      p.id            AS project_id,
      p.name          AS project_name,
      SUM(tel.hours)  AS hours_loaded
    FROM time_entries te
    JOIN users u ON u.id = te.user_id
    JOIN time_entry_lines tel ON tel.time_entry_id = te.id
    JOIN projects p ON p.id = tel.project_id
    WHERE te.status <> 'REJECTED'
      ${managerCondition}
      AND NOT EXISTS (
        SELECT 1 FROM hour_projections hp
        WHERE hp.project_id = tel.project_id
          AND hp.user_id    = te.user_id
          AND hp.start_date <= (
            to_date(
              (2000 + right(te.week, 2)::int)::text ||
              lpad(split_part(substring(te.week from 2), '/', 1), 3, '0'),
              'IYYYIW'
            ) + 6
          )
          AND hp.end_date >= to_date(
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
