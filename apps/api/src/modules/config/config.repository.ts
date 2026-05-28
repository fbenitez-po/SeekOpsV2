import { prisma } from '../../shared/db/prisma';

const active = { is_active: true };
const byName = { name: 'asc' as const };

function lookup(rows: { id: string; name: string; is_active?: boolean }[]) {
  return rows.map((r) => ({
    id: r.id,
    nombre: r.name,
    ...(r.is_active !== undefined && { activo: r.is_active }),
  }));
}

export async function getTeams() {
  return lookup(await prisma.teams.findMany({ where: active, select: { id: true, name: true, is_active: true }, orderBy: byName }));
}

export async function getAreas() {
  return lookup(await prisma.areas.findMany({ where: active, select: { id: true, name: true, is_active: true }, orderBy: byName }));
}

export async function getProfiles() {
  const rows = await prisma.profiles.findMany({ select: { id: true, code: true, name: true }, orderBy: byName });
  return rows.map((r) => ({ id: r.id, codigo: r.code, nombre: r.name }));
}

export async function getClientSegmentations() {
  return lookup(await prisma.client_segmentations.findMany({ where: active, select: { id: true, name: true, is_active: true }, orderBy: byName }));
}

export async function getClientSectors() {
  return lookup(await prisma.client_sectors.findMany({ where: active, select: { id: true, name: true, is_active: true }, orderBy: byName }));
}

export async function getProjectSegmentations() {
  return lookup(await prisma.project_segmentation.findMany({ where: active, select: { id: true, name: true, is_active: true }, orderBy: byName }));
}

export async function getProjectCategories() {
  const rows = await prisma.project_categories.findMany({
    where: active,
    select: { id: true, name: true, is_active: true, is_area_type: true },
    orderBy: byName,
  });
  return rows.map((r) => ({ id: r.id, nombre: r.name, activo: r.is_active, esDeArea: r.is_area_type }));
}

export async function getProductivityLayers() {
  return lookup(await prisma.productivity_layers.findMany({ where: active, select: { id: true, name: true, is_active: true }, orderBy: byName }));
}

export async function getServiceTypes() {
  return lookup(await prisma.service_types.findMany({ where: active, select: { id: true, name: true, is_active: true }, orderBy: byName }));
}

export async function getWorkCategories() {
  return lookup(await prisma.work_categories.findMany({ where: active, select: { id: true, name: true, is_active: true }, orderBy: byName }));
}
