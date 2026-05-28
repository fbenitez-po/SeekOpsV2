import type { EntryWithRelations, ApprovalRow } from './timeEntries.repository';

function horasEfectivas(
  linea: { hours: any; extra_hours: any },
  approval: ApprovalRow | undefined,
): { horas: number; horas_extra: number } {
  if (!approval) return { horas: 0, horas_extra: 0 };

  if (approval.accion === 'APROBADO_CON_OBSERVACION') {
    return {
      horas: approval.sugerencia_horas !== null ? Number(approval.sugerencia_horas) : 0,
      horas_extra: approval.sugerencia_extras !== null ? Number(approval.sugerencia_extras) : 0,
    };
  }
  if (approval.accion === 'APROBADO') {
    return {
      horas: Number(linea.hours),
      horas_extra: Number(linea.extra_hours),
    };
  }
  // PENDIENTE o RECHAZADO: no contribuyen a los totales
  return { horas: 0, horas_extra: 0 };
}

export function buildTimeEntryDetail(
  entry: EntryWithRelations,
  approvals: ApprovalRow[],
  viewerUserId?: string,
  viewerRoles?: string[],
) {
  const isAdmin = viewerRoles?.includes('ADMIN') ?? false;
  const isGestor = viewerRoles?.includes('GESTOR') ?? false;

  const approvalByLineId = new Map(approvals.map((a) => [a.line_id, a]));

  const activeLines = entry.time_entry_lines.filter((l) => l.is_active);

  const totalHoras = activeLines.reduce((s, l) => {
    const { horas } = horasEfectivas(l, approvalByLineId.get(l.id));
    return s + horas;
  }, 0);

  const totalExtras = activeLines.reduce((s, l) => {
    const { horas_extra } = horasEfectivas(l, approvalByLineId.get(l.id));
    return s + horas_extra;
  }, 0);

  return {
    id: entry.id,
    semana_inicio: entry.week_start_date.toISOString().slice(0, 10),
    semana_fin: entry.week_end_date.toISOString().slice(0, 10),
    fecha_carga: entry.created_at,
    usuario: {
      id: entry.user_id,
      nombres: entry.users.first_name,
      apellidos: entry.users.last_name,
    },
    lineas: activeLines.map((l) => {
      const approval = approvalByLineId.get(l.id);
      const estado = approval?.accion ?? 'PENDIENTE';
      const efectivas = horasEfectivas(l, approval);

      return {
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
        horas_efectivas: efectivas.horas,
        horas_extra_efectivas: efectivas.horas_extra,
        comentario: l.comment ?? '',
        estado,
        es_mia: isAdmin || (isGestor && (l.projects as any).manager_id === viewerUserId),
      };
    }),
    total_horas: totalHoras,
    total_extras: totalExtras,
    aprobaciones: approvals.map((a) => ({
      id: a.id,
      accion: a.accion,
      linea_id: a.line_id,
      comentario: a.comentario,
      sugerencia_horas: a.sugerencia_horas !== null ? Number(a.sugerencia_horas) : null,
      sugerencia_extras: a.sugerencia_extras !== null ? Number(a.sugerencia_extras) : null,
      realizado_por: { id: a.realizado_por_id, nombres: a.nombres, apellidos: a.apellidos },
      fecha: a.fecha,
    })),
  };
}
