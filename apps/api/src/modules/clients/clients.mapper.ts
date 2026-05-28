interface Segmentation { id: string; name: string }
interface Sector { id: string; name: string }

interface ClientRow {
  id: string;
  legal_name: string;
  trade_name?: string | null;
  ruc: string;
  contact_name?: string | null;
  contact_email?: string | null;
  phone?: string | null;
  address?: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at?: Date | null;
  client_segmentations?: Segmentation | null;
  client_sectors?: Sector | null;
  _count?: { projects: number };
}

interface ProjectRow {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
}

function toBase(c: ClientRow) {
  return {
    id: c.id,
    razon_social: c.legal_name,
    razon_comercial: c.trade_name ?? null,
    ruc: c.ruc,
    nombre_contacto: c.contact_name ?? null,
    email_contacto: c.contact_email ?? null,
    telefono: c.phone ?? null,
    direccion: c.address ?? null,
    segmentacion: c.client_segmentations
      ? { id: c.client_segmentations.id, nombre: c.client_segmentations.name }
      : null,
    sector: c.client_sectors
      ? { id: c.client_sectors.id, nombre: c.client_sectors.name }
      : null,
    activo: c.is_active,
    creado_en: c.created_at,
  };
}

export function toClientListItem(c: ClientRow & { _count: { projects: number } }) {
  return { ...toBase(c), proyectos_count: c._count.projects };
}

export function toClientDetail(c: ClientRow, proyectos: ProjectRow[]) {
  return {
    ...toBase(c),
    actualizado_en: c.updated_at ?? null,
    proyectos: proyectos.map((p) => ({
      id: p.id,
      nombre: p.name,
      codigo: p.code,
      activo: p.is_active,
    })),
  };
}

export function toClientCreated(c: { id: string; legal_name: string; ruc: string; is_active: boolean; created_at: Date }) {
  return {
    id: c.id,
    razon_social: c.legal_name,
    ruc: c.ruc,
    activo: c.is_active,
    created_at: c.created_at,
  };
}

export function toToggleResult(c: { id: string; is_active: boolean; updated_at: Date | null }) {
  return {
    id: c.id,
    activo: c.is_active,
    updated_at: c.updated_at,
  };
}

export function toUpdateResult(c: { id: string; legal_name: string; updated_at: Date | null }) {
  return {
    id: c.id,
    razon_social: c.legal_name,
    updated_at: c.updated_at,
  };
}
