import type { EntryWithRelations, ApprovalRow } from './timeEntries.repository';

export function buildTimeEntryDetail(
  entry: EntryWithRelations,
  approvals: ApprovalRow[],
  viewerUserId?: string,
  viewerRoles?: string[],
) {
  const isAdmin = viewerRoles?.includes('ADMIN') ?? false;
  const isGestor = viewerRoles?.includes('GESTOR') ?? false;

  const totalHoras = entry.time_entry_lines
    .filter((l) => l.is_active)
    .reduce((s, l) => s + Number(l.hours), 0);
  const totalExtras = entry.time_entry_lines
    .filter((l) => l.is_active)
    .reduce((s, l) => s + Number(l.extra_hours), 0);

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
        manager_id: (l.projects as any).manager_id ?? null,
      },
      categoria_ingreso: l.project_categories
        ? { id: l.income_category_id!, nombre: l.project_categories.name }
        : null,
      horas: Number(l.hours),
      horas_extra: Number(l.extra_hours),
      comentario: l.comment ?? '',
      estado: (l as any).status ?? 'PENDIENTE',
      es_mia: isAdmin || (isGestor && (l.projects as any).manager_id === viewerUserId),
    })),
    total_horas: totalHoras,
    total_extras: totalExtras,
    aprobaciones: approvals.map((a) => ({
      id: a.id,
      accion: a.accion,
      proyecto: a.proyecto_id
        ? { id: a.proyecto_id, nombre: a.proyecto_nombre }
        : null,
      comentario: a.comentario,
      sugerencia_horas: a.sugerencia_horas !== null ? Number(a.sugerencia_horas) : null,
      sugerencia_extras: a.sugerencia_extras !== null ? Number(a.sugerencia_extras) : null,
      realizado_por: { id: a.realizado_por_id, nombres: a.nombres, apellidos: a.apellidos },
      fecha: a.fecha,
    })),
  };
}
