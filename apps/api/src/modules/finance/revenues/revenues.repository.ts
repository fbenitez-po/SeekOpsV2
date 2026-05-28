import { prisma } from '../../../shared/db/prisma';
import { Prisma } from '../../../generated/prisma/client';

export interface RevenueListRow {
  id: string;
  monto: number;
  proyecto_id: string;
  proyecto_code: string;
  proyecto_nombre: string;
  mes: number;
  anio: number;
}

export interface RevenueRow {
  id: string;
  proyecto_id: string;
  periodo_id: string;
  monto: number;
}

export async function findAll(periodId?: string): Promise<RevenueListRow[]> {
  const rows = await prisma.revenues.findMany({
    where: periodId ? { period_id: periodId } : undefined,
    include: {
      projects: { select: { id: true, code: true, name: true } },
      periods: { select: { month: true, year: true } },
    },
    orderBy: [{ periods: { year: 'desc' } }, { periods: { month: 'desc' } }, { projects: { code: 'asc' } }],
  });
  return rows.map((r) => ({
    id: r.id,
    monto: Number(r.amount),
    proyecto_id: r.project_id,
    proyecto_code: r.projects.code,
    proyecto_nombre: r.projects.name,
    mes: r.periods.month,
    anio: r.periods.year,
  }));
}

export async function create(
  data: { project_id: string; period_id: string; amount: number },
  email: string | null,
): Promise<RevenueRow> {
  const r = await prisma.revenues.create({
    data: {
      project_id: data.project_id,
      period_id: data.period_id,
      amount: data.amount,
      created_by: email ?? 'admin',
      updated_by: email,
    },
    select: { id: true, project_id: true, period_id: true, amount: true },
  });
  return { id: r.id, proyecto_id: r.project_id, periodo_id: r.period_id, monto: Number(r.amount) };
}

export async function update(id: string, amount: number, email: string | null): Promise<RevenueRow | null> {
  try {
    const r = await prisma.revenues.update({
      where: { id },
      data: { amount, updated_at: new Date(), updated_by: email },
      select: { id: true, project_id: true, period_id: true, amount: true },
    });
    return { id: r.id, proyecto_id: r.project_id, periodo_id: r.period_id, monto: Number(r.amount) };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') return null;
    throw e;
  }
}

export async function remove(id: string): Promise<boolean> {
  const result = await prisma.revenues.deleteMany({ where: { id } });
  return result.count > 0;
}

export async function findProjectByCode(code: string): Promise<{ id: string } | null> {
  return prisma.projects.findFirst({ where: { code, is_active: true }, select: { id: true } });
}

export async function findPeriodByMonthYear(month: number, year: number): Promise<{ id: string } | null> {
  return prisma.periods.findFirst({ where: { month, year }, select: { id: true } });
}

export async function upsertRevenue(
  projectId: string,
  periodId: string,
  amount: number,
  email: string | null,
): Promise<boolean> {
  const result = await prisma.$queryRaw<[{ es_nuevo: boolean }]>`
    INSERT INTO revenues (project_id, period_id, amount, created_by, updated_by)
    VALUES (${projectId}::uuid, ${periodId}::uuid, ${amount}, ${email}, ${email})
    ON CONFLICT (project_id, period_id)
    DO UPDATE SET amount = EXCLUDED.amount, updated_at = NOW(), updated_by = ${email}
    RETURNING (xmax = 0) AS es_nuevo
  `;
  return result[0].es_nuevo;
}
