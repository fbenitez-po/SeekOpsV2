import { prisma } from '../../../shared/db/prisma';
import { Prisma } from '../../../generated/prisma/client';

export interface PersonnelCostDTO {
  id: string;
  periodo_id: string;
  user_id: string;
  remuneracion: number;
  dias_habiles: number;
  horas_por_dia: number;
  mes: number;
  anio: number;
  nombres: string;
  apellidos: string;
  email: string;
  horas_usadas: number;
}

export interface PersonnelCostSimpleDTO {
  id: string;
  periodo_id: string;
  user_id: string;
  remuneracion: number;
  dias_habiles: number;
  horas_por_dia: number;
}

// Static SQL fragment for horas_usadas — no user input, safe to use Prisma.raw
const horasUsadasFragment = Prisma.raw(`
  COALESCE((
    SELECT SUM(tel.hours + COALESCE(tel.extra_hours, 0))
    FROM time_entries te
    JOIN time_entry_lines tel ON tel.time_entry_id = te.id
    WHERE te.user_id = c.user_id
      AND te.status = 'APROBADO'
      AND EXTRACT(YEAR FROM to_date(
        (2000 + right(te.week, 2)::int)::text ||
        lpad(split_part(substring(te.week from 2), '/', 1), 3, '0'),
        'IYYYIW'
      )) = pe.year
      AND EXTRACT(MONTH FROM to_date(
        (2000 + right(te.week, 2)::int)::text ||
        lpad(split_part(substring(te.week from 2), '/', 1), 3, '0'),
        'IYYYIW'
      )) = pe.month
  ), 0)
`);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(r: any): PersonnelCostDTO {
  return { ...r, remuneracion: Number(r.remuneracion), horas_usadas: Number(r.horas_usadas) };
}

export async function findAll(periodId?: string): Promise<PersonnelCostDTO[]> {
  const whereClause = periodId ? Prisma.sql`WHERE c.period_id = ${periodId}::uuid` : Prisma.sql``;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = await prisma.$queryRaw<any[]>(Prisma.sql`
    SELECT c.id, c.period_id AS periodo_id, c.user_id,
           c.compensation AS remuneracion, c.business_days AS dias_habiles,
           c.hours_per_day AS horas_por_dia,
           pe.month AS mes, pe.year AS anio,
           u.first_name AS nombres, u.last_name AS apellidos, u.email,
           ${horasUsadasFragment} AS horas_usadas
    FROM personnel_costs c
    JOIN periods pe ON pe.id = c.period_id
    JOIN users u     ON u.id  = c.user_id
    ${whereClause}
    ORDER BY pe.year DESC, pe.month DESC, u.last_name, u.first_name
  `);
  return rows.map(mapRow);
}

export async function findById(id: string): Promise<PersonnelCostDTO | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = await prisma.$queryRaw<any[]>`
    SELECT c.id, c.period_id AS periodo_id, c.user_id,
           c.compensation AS remuneracion, c.business_days AS dias_habiles,
           c.hours_per_day AS horas_por_dia,
           pe.month AS mes, pe.year AS anio,
           u.first_name AS nombres, u.last_name AS apellidos, u.email,
           ${horasUsadasFragment} AS horas_usadas
    FROM personnel_costs c
    JOIN periods pe ON pe.id = c.period_id
    JOIN users u     ON u.id  = c.user_id
    WHERE c.id = ${id}::uuid
  `;
  if (!rows.length) return null;
  return mapRow(rows[0]);
}

export async function create(
  data: { period_id: string; user_id: string; compensation: number; business_days: number; hours_per_day: number },
  email: string | null,
): Promise<PersonnelCostSimpleDTO> {
  const r = await prisma.personnel_costs.create({
    data: {
      period_id: data.period_id,
      user_id: data.user_id,
      compensation: data.compensation,
      business_days: data.business_days,
      hours_per_day: data.hours_per_day,
      created_by: email ?? 'admin',
      updated_by: email,
    },
    select: { id: true, period_id: true, user_id: true, compensation: true, business_days: true, hours_per_day: true },
  });
  return {
    id: r.id,
    periodo_id: r.period_id,
    user_id: r.user_id,
    remuneracion: Number(r.compensation),
    dias_habiles: r.business_days,
    horas_por_dia: r.hours_per_day,
  };
}

export async function update(
  id: string,
  data: { period_id: string; user_id: string; compensation: number; business_days: number; hours_per_day: number },
  email: string | null,
): Promise<PersonnelCostSimpleDTO | null> {
  try {
    const r = await prisma.personnel_costs.update({
      where: { id },
      data: {
        period_id: data.period_id,
        user_id: data.user_id,
        compensation: data.compensation,
        business_days: data.business_days,
        hours_per_day: data.hours_per_day,
        updated_at: new Date(),
        updated_by: email,
      },
      select: { id: true, period_id: true, user_id: true, compensation: true, business_days: true, hours_per_day: true },
    });
    return {
      id: r.id,
      periodo_id: r.period_id,
      user_id: r.user_id,
      remuneracion: Number(r.compensation),
      dias_habiles: r.business_days,
      horas_por_dia: r.hours_per_day,
    };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') return null;
    throw e;
  }
}

export async function remove(id: string): Promise<boolean> {
  const result = await prisma.personnel_costs.deleteMany({ where: { id } });
  return result.count > 0;
}

export async function upsertImport(
  data: { period_id: string; user_id: string; compensation: number; business_days: number; hours_per_day: number },
  email: string | null,
): Promise<void> {
  await prisma.personnel_costs.upsert({
    where: { period_id_user_id: { period_id: data.period_id, user_id: data.user_id } },
    update: {
      compensation: data.compensation,
      business_days: data.business_days,
      hours_per_day: data.hours_per_day,
      updated_at: new Date(),
      updated_by: email,
    },
    create: {
      period_id: data.period_id,
      user_id: data.user_id,
      compensation: data.compensation,
      business_days: data.business_days,
      hours_per_day: data.hours_per_day,
      created_by: email ?? 'admin',
      updated_by: email,
    },
  });
}
