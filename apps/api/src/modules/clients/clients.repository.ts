import { prisma } from '../../shared/db/prisma';
import { Prisma } from '../../generated/prisma/client';
import type { CreateClientInput, UpdateClientInput, ListClientsQuery } from './clients.schema';

export async function findAll(query: ListClientsQuery) {
  const limit = Math.min(parseInt(query.limit ?? '20') || 20, 100);
  const page = parseInt(query.page ?? '1') || 1;
  const skip = (page - 1) * limit;

  const where: Prisma.clientsWhereInput = {};
  if (query.activo !== undefined) where.is_active = query.activo === 'true';
  if (query.segmentacion_id) where.segmentation_id = query.segmentacion_id;
  if (query.search) {
    where.OR = [
      { legal_name: { contains: query.search, mode: 'insensitive' } },
      { trade_name: { contains: query.search, mode: 'insensitive' } },
      { ruc: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const [clients, total] = await Promise.all([
    prisma.clients.findMany({
      where,
      include: {
        client_segmentations: true,
        client_sectors: true,
        _count: { select: { projects: true } },
      },
      orderBy: { legal_name: 'asc' },
      skip,
      take: limit,
    }),
    prisma.clients.count({ where }),
  ]);

  return { clients, total, limit, page };
}

export async function findById(id: string) {
  return prisma.clients.findUnique({
    where: { id },
    include: {
      client_segmentations: true,
      client_sectors: true,
    },
  });
}

export async function findProjectsByClientId(clientId: string) {
  return prisma.projects.findMany({
    where: { client_id: clientId },
    select: { id: true, name: true, code: true, is_active: true },
    orderBy: { name: 'asc' },
  });
}

export async function existsByRuc(ruc: string, excludeId?: string) {
  const where: Prisma.clientsWhereInput = { ruc };
  if (excludeId) where.id = { not: excludeId };
  return (await prisma.clients.count({ where })) > 0;
}

export async function create(data: CreateClientInput, createdBy: string | null) {
  return prisma.clients.create({
    data: {
      legal_name: data.razon_social,
      trade_name: data.razon_comercial ?? null,
      ruc: data.ruc,
      contact_name: data.nombre_contacto ?? null,
      contact_email: data.email_contacto ?? null,
      phone: data.telefono ?? null,
      address: data.direccion ?? null,
      segmentation_id: data.segmentacion_id,
      sector_id: data.sector_id ?? null,
      is_active: data.activo !== false,
      created_by: createdBy ?? 'admin',
      updated_by: createdBy,
    },
    select: { id: true, legal_name: true, ruc: true, is_active: true, created_at: true },
  });
}

export async function update(id: string, data: UpdateClientInput, updatedBy: string | null) {
  const patch: Prisma.clientsUpdateInput = {
    updated_at: new Date(),
    updated_by: updatedBy,
  };
  if (data.razon_social !== undefined) patch.legal_name = data.razon_social;
  if (data.razon_comercial !== undefined) patch.trade_name = data.razon_comercial ?? null;
  if (data.ruc !== undefined) patch.ruc = data.ruc;
  if (data.nombre_contacto !== undefined) patch.contact_name = data.nombre_contacto ?? null;
  if (data.email_contacto !== undefined) patch.contact_email = data.email_contacto ?? null;
  if (data.telefono !== undefined) patch.phone = data.telefono ?? null;
  if (data.direccion !== undefined) patch.address = data.direccion ?? null;
  if (data.activo !== undefined) patch.is_active = data.activo;
  if (data.segmentacion_id !== undefined) {
    patch.client_segmentations = { connect: { id: data.segmentacion_id } };
  }
  if (data.sector_id !== undefined) {
    patch.client_sectors = data.sector_id
      ? { connect: { id: data.sector_id } }
      : { disconnect: true };
  }

  return prisma.clients.update({
    where: { id },
    data: patch,
    select: { id: true, legal_name: true, updated_at: true },
  });
}

export async function toggleActive(id: string, updatedBy: string | null) {
  const existing = await prisma.clients.findUnique({
    where: { id },
    select: { is_active: true },
  });
  if (!existing) return null;

  return prisma.clients.update({
    where: { id },
    data: {
      is_active: !existing.is_active,
      deleted_at: existing.is_active ? new Date() : null,
      deleted_by: existing.is_active ? updatedBy : null,
      updated_at: new Date(),
      updated_by: updatedBy,
    },
    select: { id: true, is_active: true, updated_at: true },
  });
}
