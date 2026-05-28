import { prisma } from '../../shared/db/prisma';
import { Prisma } from '../../generated/prisma/client';

const recordIncludes = {
  projects: {
    select: {
      id: true, code: true, name: true, start_date: true, end_date: true,
      service_types: { select: { name: true } },
      project_segmentation: { select: { name: true } },
    },
  },
  users: { select: { id: true, first_name: true, last_name: true } },
  document_types: { select: { id: true, name: true } },
} as const;

type RecordWithRelations = Prisma.commercial_recordsGetPayload<{ include: typeof recordIncludes }>;

function toListDTO(r: RecordWithRelations) {
  return {
    id: r.id,
    fecha_registro: r.record_date,
    precio: Number(r.price),
    moneda: r.currency,
    estado_contrato: r.has_contract,
    facturacion: r.is_billed,
    evidencia_nombre: r.evidence_filename,
    detalle: r.detail,
    proyecto_id: r.project_id,
    proyecto_code: r.projects.code,
    proyecto_nombre: r.projects.name,
    responsable_id: r.owner_id,
    responsable_nombres: r.users.first_name,
    responsable_apellidos: r.users.last_name,
    tipo_documento_id: r.document_type_id,
    tipo_documento_nombre: r.document_types?.name ?? null,
    proyecto_tipo: r.projects.service_types?.name ?? null,
    proyecto_division: r.projects.project_segmentation?.name ?? null,
    fecha_inicio: r.projects.start_date,
    fecha_fin: r.projects.end_date,
  };
}

function toDetailDTO(r: RecordWithRelations) {
  return {
    ...toListDTO(r),
    proyecto_code: r.projects.code,
    proyecto_nombre: r.projects.name,
    proyecto_tipo: r.projects.service_types?.name ?? null,
    proyecto_division: r.projects.project_segmentation?.name ?? null,
  };
}

export async function findAll(projectId?: string) {
  const rows = await prisma.commercial_records.findMany({
    where: projectId ? { project_id: projectId } : undefined,
    include: recordIncludes,
    orderBy: [{ record_date: 'desc' }, { created_at: 'desc' }],
  });
  return rows.map(toListDTO);
}

export async function findById(id: string) {
  const r = await prisma.commercial_records.findUnique({ where: { id }, include: recordIncludes });
  if (!r) return null;
  return toDetailDTO(r);
}

export interface CommercialInput {
  fecha_registro: string;
  proyecto_id: string;
  responsable_id: string;
  detalle?: string | null;
  precio: number;
  tipo_documento_id?: string | null;
  estado_contrato?: boolean;
  facturacion?: boolean;
  evidencia_nombre?: string | null;
}

export async function create(data: CommercialInput, email: string | null): Promise<{ id: string }> {
  return prisma.commercial_records.create({
    data: {
      record_date: new Date(data.fecha_registro),
      project_id: data.proyecto_id,
      owner_id: data.responsable_id,
      detail: data.detalle?.trim() ?? null,
      price: data.precio,
      currency: 'PEN',
      document_type_id: data.tipo_documento_id ?? null,
      has_contract: data.estado_contrato ?? false,
      is_billed: data.facturacion ?? false,
      evidence_filename: data.evidencia_nombre?.trim() ?? null,
      created_by: email ?? 'admin',
      updated_by: email,
    },
    select: { id: true },
  });
}

export async function update(id: string, data: CommercialInput, email: string | null): Promise<{ id: string } | null> {
  try {
    return await prisma.commercial_records.update({
      where: { id },
      data: {
        record_date: new Date(data.fecha_registro),
        project_id: data.proyecto_id,
        owner_id: data.responsable_id,
        detail: data.detalle?.trim() ?? null,
        price: data.precio,
        document_type_id: data.tipo_documento_id ?? null,
        has_contract: data.estado_contrato ?? false,
        is_billed: data.facturacion ?? false,
        evidence_filename: data.evidencia_nombre?.trim() ?? null,
        updated_at: new Date(),
        updated_by: email,
      },
      select: { id: true },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') return null;
    throw e;
  }
}

export async function remove(id: string): Promise<boolean> {
  const result = await prisma.commercial_records.deleteMany({ where: { id } });
  return result.count > 0;
}

export async function findDocumentTypes() {
  const rows = await prisma.document_types.findMany({
    where: { is_active: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });
  return rows.map((r) => ({ id: r.id, nombre: r.name }));
}
