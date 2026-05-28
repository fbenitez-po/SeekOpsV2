interface TeamRow { id: string; name: string }
interface AreaRow { id: string; name: string }
interface UserAreaRow { areas: AreaRow }
interface ProfileRow { code: string }
interface UserProfileRow { profiles: ProfileRow }
interface ClientRow { legal_name: string; trade_name: string | null }
interface ProjectRow { id: string; name: string; code: string; is_active: boolean; clients: ClientRow }
interface ProjectUserRow { role: string; projects: ProjectRow }

interface UserRow {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  document_number: string;
  position: string;
  mobile_phone?: string | null;
  avatar_url?: string | null;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  hire_date: Date;
  created_at: Date;
  updated_at?: Date | null;
  deleted_at?: Date | null;
  teams?: TeamRow | null;
  user_area?: UserAreaRow[];
  user_profile?: UserProfileRow[];
  project_user?: ProjectUserRow[];
}

function toBase(u: UserRow) {
  return {
    id: u.id,
    email: u.email,
    nombres: u.first_name,
    apellidos: u.last_name,
    numero_documento: u.document_number,
    puesto: u.position,
    celular: u.mobile_phone ?? null,
    avatar_url: u.avatar_url ?? null,
    activo: u.is_active,
    staff: u.is_staff,
    super_usuario: u.is_superuser,
    equipo: u.teams ? { id: u.teams.id, nombre: u.teams.name } : null,
    areas: (u.user_area ?? []).map((ua) => ({ id: ua.areas.id, nombre: ua.areas.name })),
    grupos: (u.user_profile ?? []).map((up) => up.profiles.code),
    fecha_ingreso: u.hire_date,
    creado_en: u.created_at,
    actualizado_en: u.updated_at ?? null,
  };
}

export function toUserListItem(u: UserRow) {
  return toBase(u);
}

export function toUserDetail(u: UserRow) {
  return {
    ...toBase(u),
    proyectos: (u.project_user ?? []).map((pu) => ({
      id: pu.projects.id,
      nombre: pu.projects.name,
      codigo: pu.projects.code,
      cliente: pu.projects.clients.trade_name ?? pu.projects.clients.legal_name,
      rol: pu.role,
      activo: pu.projects.is_active,
    })),
    desactivado_en: u.deleted_at ?? null,
  };
}

export function toUserCreated(u: { id: string; email: string; first_name: string; last_name: string; is_active: boolean; created_at: Date }) {
  return {
    id: u.id,
    email: u.email,
    nombres: u.first_name,
    apellidos: u.last_name,
    activo: u.is_active,
    created_at: u.created_at,
  };
}

export function toToggleResult(u: { id: string; is_active: boolean; deleted_at: Date | null }) {
  return { id: u.id, activo: u.is_active, deleted_at: u.deleted_at };
}
