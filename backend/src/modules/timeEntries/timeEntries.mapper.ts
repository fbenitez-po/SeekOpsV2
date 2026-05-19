import type { EntryWithRelations, ApprovalRow } from './timeEntries.repository';

export function buildTimeEntryDetail(entry: EntryWithRelations, approvals: ApprovalRow[]) {
  const totalHoras = entry.time_entry_lines.reduce((s, l) => s + Number(l.hours), 0);
  const totalExtras = entry.time_entry_lines.reduce((s, l) => s + Number(l.extra_hours), 0);

  return {
    id: entry.id,
    semana: entry.week,
    estado: entry.status,
    fecha_carga: entry.created_at,
    usuario: {
      id: entry.user_id,
      nombres: entry.users.first_name,
      apellidos: entry.users.last_name,
    },
    lineas: entry.time_entry_lines.map((l) => ({
      id: l.id,
      proyecto: {
        id: l.project_id,
        nombre: l.projects.name,
        codigo: l.projects.code,
      },
      categoria_ingreso: l.income_categories
        ? { id: l.income_category_id!, nombre: l.income_categories.name }
        : null,
      horas: Number(l.hours),
      horas_extra: Number(l.extra_hours),
      comentario: l.comment ?? '',
    })),
    total_horas: totalHoras,
    total_extras: totalExtras,
    aprobaciones: approvals.map((a) => ({
      id: a.id,
      accion: a.accion,
      comentario: a.comentario,
      sugerencia_horas: a.sugerencia_horas !== null ? Number(a.sugerencia_horas) : null,
      sugerencia_extras: a.sugerencia_extras !== null ? Number(a.sugerencia_extras) : null,
      realizado_por: { id: a.realizado_por_id, nombres: a.nombres, apellidos: a.apellidos },
      fecha: a.fecha,
    })),
  };
}
