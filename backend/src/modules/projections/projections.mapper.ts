import type { ProjectionWithRelations, AlertRow } from './projections.repository';

export interface ProjectionDTO {
  id: string;
  project_id: string;
  proyecto_nombre: string;
  proyecto_codigo: string;
  user_id: string;
  usuario_nombres: string;
  usuario_apellidos: string;
  fecha_inicio: Date;
  fecha_fin: Date;
  horas_proyectadas: number;
  notas: string | null;
  work_category_id: string | null;
  work_category_nombre: string | null;
  created_at: Date;
  updated_at: Date | null;
}

export function toProjectionItem(row: ProjectionWithRelations): ProjectionDTO {
  return {
    id: row.id,
    project_id: row.project_id,
    proyecto_nombre: row.projects.name,
    proyecto_codigo: row.projects.code,
    user_id: row.user_id,
    usuario_nombres: row.users.first_name,
    usuario_apellidos: row.users.last_name,
    fecha_inicio: row.start_date,
    fecha_fin: row.end_date,
    horas_proyectadas: Number(row.projected_hours),
    notas: row.notes ?? null,
    work_category_id: row.work_category_id ?? null,
    work_category_nombre: row.work_categories?.name ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at ?? null,
  };
}

export function toAlertList(rows: AlertRow[]) {
  return rows;
}
