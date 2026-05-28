import { prisma } from '../../../shared/db/prisma';
import { Prisma } from '../../../generated/prisma/client';

export interface ExpenseDTO {
  id: string;
  codigo: string;
  descripcion: string | null;
  monto: number;
  periodo_id?: string;
  mes: number;
  anio: number;
}

function toDTO(r: {
  id: string; code: string; description: string | null; amount: Prisma.Decimal;
  period_id: string; periods: { month: number; year: number };
}, includeId: boolean): ExpenseDTO {
  return {
    id: r.id,
    codigo: r.code,
    descripcion: r.description,
    monto: Number(r.amount),
    ...(includeId ? { periodo_id: r.period_id } : {}),
    mes: r.periods.month,
    anio: r.periods.year,
  };
}

const includes = { periods: { select: { month: true, year: true } } } as const;

export async function findAll(periodId?: string): Promise<ExpenseDTO[]> {
  const rows = await prisma.admin_expenses.findMany({
    where: periodId ? { period_id: periodId } : undefined,
    include: includes,
    orderBy: [{ periods: { year: 'desc' } }, { periods: { month: 'desc' } }, { code: 'asc' }],
  });
  return rows.map((r) => toDTO(r, false));
}

export async function findById(id: string): Promise<ExpenseDTO | null> {
  const r = await prisma.admin_expenses.findUnique({ where: { id }, include: includes });
  if (!r) return null;
  return toDTO(r, true);
}

export async function create(
  data: { period_id: string; codigo: string; descripcion?: string | null; monto: number },
  email: string | null,
): Promise<{ id: string; periodo_id: string; codigo: string; descripcion: string | null; monto: number }> {
  const r = await prisma.admin_expenses.create({
    data: {
      period_id: data.period_id,
      code: data.codigo.trim(),
      description: data.descripcion?.trim() ?? null,
      amount: data.monto,
      created_by: email ?? 'admin',
      updated_by: email,
    },
    select: { id: true, period_id: true, code: true, description: true, amount: true },
  });
  return { id: r.id, periodo_id: r.period_id, codigo: r.code, descripcion: r.description, monto: Number(r.amount) };
}

export async function update(
  id: string,
  data: { period_id: string; codigo: string; descripcion?: string | null; monto: number },
  email: string | null,
): Promise<{ id: string; periodo_id: string; codigo: string; descripcion: string | null; monto: number } | null> {
  try {
    const r = await prisma.admin_expenses.update({
      where: { id },
      data: {
        period_id: data.period_id,
        code: data.codigo.trim(),
        description: data.descripcion?.trim() ?? null,
        amount: data.monto,
        updated_at: new Date(),
        updated_by: email,
      },
      select: { id: true, period_id: true, code: true, description: true, amount: true },
    });
    return { id: r.id, periodo_id: r.period_id, codigo: r.code, descripcion: r.description, monto: Number(r.amount) };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') return null;
    throw e;
  }
}

export async function remove(id: string): Promise<boolean> {
  const result = await prisma.admin_expenses.deleteMany({ where: { id } });
  return result.count > 0;
}
