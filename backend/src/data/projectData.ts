import {prisma} from "../lib/prisma";
import {Prisma, ProjectRole} from "@prisma/client";

interface ProjectFilters {
  isActive?: string;
  clientId?: string;
  managerId?: string;
  search?: string;
  limit?: string;
  page?: string;
}

interface CreateProjectData {
  code: string;
  name: string;
  description?: string;
  clientId: string;
  segmentationId?: string;
  productivityLayerId?: string;
  serviceTypeId?: string;
  managerId: string;
  areaId?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  isActive?: boolean;
  categoryIds?: string[];
}

interface UpdateProjectData {
  code?: string;
  name?: string;
  description?: string;
  clientId?: string;
  segmentationId?: string;
  productivityLayerId?: string;
  serviceTypeId?: string;
  managerId?: string;
  areaId?: string | null;
  startDate?: string | Date;
  endDate?: string | Date;
  isActive?: boolean;
  categoryIds?: string[];
}

const projectSelect = {
  id: true,
  code: true,
  name: true,
  description: true,
  isActive: true,
  startDate: true,
  endDate: true,
  createdAt: true,
  updatedAt: true,
  client: { select: { id: true, name: true, taxId: true } },
  manager: { select: { id: true, firstName: true, lastName: true } },
  segmentation: { select: { id: true, name: true } },
  productivityLayer: { select: { id: true, name: true } },
  serviceType: { select: { id: true, name: true } },
  area: { select: { id: true, name: true } },
  categories: {
    select: { category: { select: { id: true, name: true } } },
  },
} satisfies Prisma.ProjectSelect;

export async function listProjects(
  filters: ProjectFilters,
  userId: string,
  roles: string[]
) {
  const limit = Math.min(parseInt(filters.limit ?? "20"), 100);
  const page = parseInt(filters.page ?? "1");
  const offset = (page - 1) * limit;

  const where: Prisma.ProjectWhereInput = {};

  if (!roles.includes("ADMIN")) {
    if (roles.includes("MANAGER")) {
      where.OR = [
        { managerId: userId },
        { members: { some: { userId } } },
      ];
    } else {
      where.members = { some: { userId } };
    }
  }

  if (filters.isActive !== undefined) where.isActive = filters.isActive === "true";
  if (filters.clientId) where.clientId = filters.clientId;
  if (filters.managerId) where.managerId = filters.managerId;
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { code: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const [projects, total] = await prisma.$transaction([
    prisma.project.findMany({
      where,
      select: {
        ...projectSelect,
        _count: { select: { members: true } },
      },
      skip: offset,
      take: limit,
      orderBy: { name: "asc" },
    }),
    prisma.project.count({ where }),
  ]);

  return { projects, total };
}

export async function findProjectById(id: string) {
  return prisma.project.findUnique({ where: { id }, select: projectSelect });
}

export async function getProjectMembers(projectId: string) {
  return prisma.projectUser.findMany({
    where: { projectId },
    select: {
      role: true,
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: { user: { lastName: "asc" } },
  });
}

export async function codeExists(code: string, excludeId?: string) {
  const count = await prisma.project.count({
    where: { code, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
  });
  return count > 0;
}

export async function userHasManagerRole(userId: string) {
  const membership = await prisma.userGroupMember.findFirst({
    where: { userId, group: { code: "MANAGER" } },
  });
  return !!membership;
}

export async function createProject(data: CreateProjectData) {
  return prisma.$transaction(async (tx) => {
    const project = await tx.project.create({
      data: {
        code: data.code,
        name: data.name,
        description: data.description ?? null,
        clientId: data.clientId,
        segmentationId: data.segmentationId ?? null,
        productivityLayerId: data.productivityLayerId ?? null,
        serviceTypeId: data.serviceTypeId ?? null,
        managerId: data.managerId,
        areaId: data.areaId ?? null,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        isActive: data.isActive !== false,
        categories: data.categoryIds?.length
          ? { create: data.categoryIds.map((categoryId) => ({ categoryId })) }
          : undefined,
      },
      select: { id: true, code: true, name: true, isActive: true, createdAt: true },
    });
    return project;
  });
}

export async function updateProject(id: string, data: UpdateProjectData) {
  return prisma.$transaction(async (tx) => {
    await tx.project.update({
      where: { id },
      data: {
        ...(data.code !== undefined && { code: data.code }),
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.clientId !== undefined && { clientId: data.clientId }),
        ...(data.segmentationId !== undefined && { segmentationId: data.segmentationId }),
        ...(data.productivityLayerId !== undefined && { productivityLayerId: data.productivityLayerId }),
        ...(data.serviceTypeId !== undefined && { serviceTypeId: data.serviceTypeId }),
        ...(data.managerId !== undefined && { managerId: data.managerId }),
        ...(data.areaId !== undefined && { areaId: data.areaId }),
        ...(data.startDate !== undefined && { startDate: new Date(data.startDate) }),
        ...(data.endDate !== undefined && { endDate: new Date(data.endDate) }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        updatedAt: new Date(),
      },
    });

    if (data.categoryIds !== undefined) {
      await tx.projectProjectCategory.deleteMany({ where: { projectId: id } });
      if (data.categoryIds.length > 0) {
        await tx.projectProjectCategory.createMany({
          data: data.categoryIds.map((categoryId) => ({ projectId: id, categoryId })),
          skipDuplicates: true,
        });
      }
    }

    return tx.project.findUnique({ where: { id }, select: projectSelect });
  });
}

export async function toggleIsActive(id: string) {
  const project = await prisma.project.findUniqueOrThrow({ where: { id }, select: { isActive: true } });
  return prisma.project.update({
    where: { id },
    data: { isActive: !project.isActive, updatedAt: new Date() },
    select: { id: true, isActive: true, updatedAt: true },
  });
}

export async function assignUsers(
  projectId: string,
  users: Array<{ userId: string; role: ProjectRole }>
) {
  const assigned: typeof users = [];
  const alreadyExisted: typeof users = [];

  for (const { userId, role } of users) {
    const existing = await prisma.projectUser.findFirst({
      where: { projectId, userId, role },
    });
    if (existing) {
      alreadyExisted.push({ userId, role });
    } else {
      await prisma.projectUser.create({ data: { projectId, userId, role } });
      assigned.push({ userId, role });
    }
  }

  return { assigned, alreadyExisted };
}

export async function removeUser(projectId: string, userId: string) {
  const existing = await prisma.projectUser.findFirst({ where: { projectId, userId } });
  if (!existing) return false;
  await prisma.projectUser.deleteMany({ where: { projectId, userId } });
  return true;
}
