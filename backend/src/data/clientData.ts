import {prisma} from "../lib/prisma";
import {Prisma} from "@prisma/client";

interface ClientFilters {
  isActive?: string;
  search?: string;
  segmentationId?: string;
  limit?: string;
  page?: string;
}

interface CreateClientData {
  name: string;
  legalName?: string;
  tradeName?: string;
  taxId: string;
  contactName?: string;
  contactEmail?: string;
  phone?: string;
  address?: string;
  categoryId: string;
  segmentationId: string;
  sectorId?: string;
  isActive?: boolean;
}

interface UpdateClientData {
  name?: string;
  legalName?: string;
  tradeName?: string;
  taxId?: string;
  contactName?: string;
  contactEmail?: string;
  phone?: string;
  address?: string;
  categoryId?: string;
  segmentationId?: string;
  sectorId?: string;
  isActive?: boolean;
}

const clientSelect = {
  id: true,
  name: true,
  legalName: true,
  tradeName: true,
  taxId: true,
  contactName: true,
  contactEmail: true,
  phone: true,
  address: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  category: { select: { id: true, name: true } },
  segmentation: { select: { id: true, name: true } },
  sector: { select: { id: true, name: true } },
} satisfies Prisma.ClientSelect;

export async function listClients(filters: ClientFilters) {
  const limit = Math.min(parseInt(filters.limit ?? "20"), 100);
  const page = parseInt(filters.page ?? "1");
  const offset = (page - 1) * limit;

  const where: Prisma.ClientWhereInput = {};
  if (filters.isActive !== undefined) where.isActive = filters.isActive === "true";
  if (filters.segmentationId) where.segmentationId = filters.segmentationId;
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { taxId: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const [clients, total] = await prisma.$transaction([
    prisma.client.findMany({ where, select: clientSelect, skip: offset, take: limit, orderBy: { name: "asc" } }),
    prisma.client.count({ where }),
  ]);

  return { clients, total };
}

export async function findClientById(id: string) {
  return prisma.client.findUnique({ where: { id }, select: clientSelect });
}

export async function getClientProjects(clientId: string) {
  return prisma.project.findMany({
    where: { clientId },
    select: { id: true, name: true, code: true, isActive: true },
    orderBy: { name: "asc" },
  });
}

export async function taxIdExists(taxId: string, excludeId?: string) {
  const count = await prisma.client.count({
    where: { taxId, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
  });
  return count > 0;
}

export async function createClient(data: CreateClientData) {
  return prisma.client.create({
    data: {
      name: data.name,
      legalName: data.legalName ?? null,
      tradeName: data.tradeName ?? null,
      taxId: data.taxId,
      contactName: data.contactName ?? null,
      contactEmail: data.contactEmail ?? null,
      phone: data.phone ?? null,
      address: data.address ?? null,
      categoryId: data.categoryId,
      segmentationId: data.segmentationId,

      sectorId: data.sectorId ?? null,
      isActive: data.isActive !== false,
    },
    select: { id: true, name: true, taxId: true, isActive: true, createdAt: true },
  });
}

export async function updateClient(id: string, data: UpdateClientData) {
  return prisma.client.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.legalName !== undefined && { legalName: data.legalName }),
      ...(data.tradeName !== undefined && { tradeName: data.tradeName }),
      ...(data.taxId !== undefined && { taxId: data.taxId }),
      ...(data.contactName !== undefined && { contactName: data.contactName }),
      ...(data.contactEmail !== undefined && { contactEmail: data.contactEmail }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.address !== undefined && { address: data.address }),
      ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
      ...(data.segmentationId !== undefined && { segmentationId: data.segmentationId }),
      ...(data.sectorId !== undefined && { sectorId: data.sectorId }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      updatedAt: new Date(),
    },
    select: { id: true, name: true, updatedAt: true },
  });
}

export async function toggleIsActive(id: string) {
  const client = await prisma.client.findUniqueOrThrow({ where: { id }, select: { isActive: true } });
  return prisma.client.update({
    where: { id },
    data: { isActive: !client.isActive, updatedAt: new Date() },
    select: { id: true, isActive: true, updatedAt: true },
  });
}
