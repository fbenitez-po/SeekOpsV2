import { prisma } from '../../../shared/db/prisma';

export interface PeriodDTO {
  id: string;
  mes: number;
  anio: number;
  esta_cerrado: boolean;
  updated_at: Date | null;
}

function toDTO(r: { id: string; month: number; year: number; is_closed: boolean; updated_at: Date | null }): PeriodDTO {
  return { id: r.id, mes: r.month, anio: r.year, esta_cerrado: r.is_closed, updated_at: r.updated_at };
}

export async function findUpToCurrent(year: number, month: number): Promise<PeriodDTO[]> {
  const rows = await prisma.periods.findMany({
    where: { OR: [{ year: { lt: year } }, { year, month: { lte: month } }] },
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
    select: { id: true, month: true, year: true, is_closed: true, updated_at: true },
  });
  return rows.map(toDTO);
}

export async function toggle(id: string): Promise<PeriodDTO | null> {
  const existing = await prisma.periods.findUnique({ where: { id }, select: { is_closed: true } });
  if (!existing) return null;
  const updated = await prisma.periods.update({
    where: { id },
    data: { is_closed: !existing.is_closed, updated_at: new Date() },
    select: { id: true, month: true, year: true, is_closed: true, updated_at: true },
  });
  return toDTO(updated);
}
