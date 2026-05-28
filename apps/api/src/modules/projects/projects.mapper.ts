interface ClientRow { id: string; legal_name: string; trade_name: string | null }
interface ManagerRow { id: string; first_name: string; last_name: string }
interface SegmentationRow { id: string; name: string }
interface ServiceTypeRow { id: string; name: string }
interface AreaRow { id: string; name: string }
interface CategoryRow { id: string; name: string }
interface ProjectCategoryRow { project_categories: CategoryRow }
interface AssignedUserRow {
  role: string;
  users: { id: string; first_name: string; last_name: string; email: string; avatar_url: string | null };
}

interface ProjectRow {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
  start_date?: Date | null;
  end_date?: Date | null;
  actual_start_date?: Date | null;
  actual_end_date?: Date | null;
  created_at?: Date;
  updated_at?: Date | null;
  clients?: ClientRow | null;
  users?: ManagerRow | null;
  project_segmentation?: SegmentationRow | null;
  service_types?: ServiceTypeRow | null;
  areas?: AreaRow | null;
  project_project_category?: ProjectCategoryRow[];
  project_user?: AssignedUserRow[];
  _count?: { project_user: number };
}

function toBase(p: ProjectRow) {
  return {
    id: p.id,
    codigo: p.code,
    nombre: p.name,
    cliente: p.clients ? { id: p.clients.id, nombre: p.clients.trade_name ?? p.clients.legal_name } : null,
    gestor: p.users ? { id: p.users.id, nombres: p.users.first_name, apellidos: p.users.last_name } : null,
    segmentacion: p.project_segmentation ? { id: p.project_segmentation.id, nombre: p.project_segmentation.name } : null,
    categorias_ingreso: (p.project_project_category ?? []).map((c) => ({ id: c.project_categories.id, nombre: c.project_categories.name })),
    tipo_servicio: p.service_types ? { id: p.service_types.id, nombre: p.service_types.name } : null,
    area: p.areas ? { id: p.areas.id, nombre: p.areas.name } : null,
    fecha_inicio: p.start_date ?? null,
    fecha_fin: p.end_date ?? null,
    fecha_inicio_real: p.actual_start_date ?? null,
    fecha_fin_real: p.actual_end_date ?? null,
    activo: p.is_active,
  };
}

export function toProjectListItem(p: ProjectRow & { _count: { project_user: number } }) {
  return { ...toBase(p), usuarios_count: p._count.project_user };
}

export function toProjectDetail(p: ProjectRow) {
  return {
    ...toBase(p),
    usuarios: (p.project_user ?? []).map((pu) => ({
      id: pu.users.id,
      nombres: pu.users.first_name,
      apellidos: pu.users.last_name,
      email: pu.users.email,
      rol: pu.role,
      avatar_url: pu.users.avatar_url,
    })),
    creado_en: p.created_at,
    actualizado_en: p.updated_at ?? null,
  };
}

export function toProjectCreated(p: { id: string; code: string; name: string; is_active: boolean; created_at: Date }) {
  return { id: p.id, codigo: p.code, nombre: p.name, activo: p.is_active, created_at: p.created_at };
}

export function toToggleResult(p: { id: string; is_active: boolean; updated_at: Date | null }) {
  return { id: p.id, activo: p.is_active, updated_at: p.updated_at };
}
