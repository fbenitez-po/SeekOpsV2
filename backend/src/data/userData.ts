import {prisma} from "../lib/prisma";
import {Prisma} from "@prisma/client";

interface UserFilters {
  isActive?: string;
  search?: string;
  teamId?: string;
  limit?: string;
  page?: string;
}

interface CreateUserData {
  email: string;
  firstName: string;
  lastName: string;
  documentNumber: string;
  jobTitle: string;
  phone?: string;
  avatarUrl?: string;
  teamId: string;
  hireDate: string | Date;
  isActive?: boolean;
  isStaff?: boolean;
  isSuperUser?: boolean;
  areas?: string[];
  groups?: string[];
}

interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  documentNumber?: string;
  jobTitle?: string;
  phone?: string;
  avatarUrl?: string;
  teamId?: string;
  hireDate?: string | Date;
  isActive?: boolean;
  isStaff?: boolean;
  isSuperUser?: boolean;
  areas?: string[];
  groups?: string[];
}

const userSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  documentNumber: true,
  jobTitle: true,
  phone: true,
  avatarUrl: true,
  isActive: true,
  isStaff: true,
  isSuperUser: true,
  hireDate: true,
  createdAt: true,
  updatedAt: true,
  deactivatedAt: true,
  team: { select: { id: true, name: true } },
  areas: { select: { area: { select: { id: true, name: true } } } },
  groups: { select: { group: { select: { code: true } } } },
} satisfies Prisma.UserSelect;

export async function listUsers(filters: UserFilters) {
  const limit = Math.min(parseInt(filters.limit ?? "20"), 100);
  const page = parseInt(filters.page ?? "1");
  const offset = (page - 1) * limit;

  const where: Prisma.UserWhereInput = {};
  if (filters.isActive !== undefined) where.isActive = filters.isActive === "true";
  if (filters.teamId) where.teamId = filters.teamId;
  if (filters.search) {
    where.OR = [
      { firstName: { contains: filters.search, mode: "insensitive" } },
      { lastName: { contains: filters.search, mode: "insensitive" } },
      { email: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({ where, select: userSelect, skip: offset, take: limit, orderBy: [{ lastName: "asc" }, { firstName: "asc" }] }),
    prisma.user.count({ where }),
  ]);

  return { users, total };
}

export async function findUserById(id: string) {
  return prisma.user.findUnique({ where: { id }, select: userSelect });
}

export async function emailExists(email: string, excludeId?: string) {
  const count = await prisma.user.count({
    where: { email, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
  });
  return count > 0;
}

export async function documentNumberExists(documentNumber: string, excludeId?: string) {
  const count = await prisma.user.count({
    where: { documentNumber, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
  });
  return count > 0;
}

export async function createUser(data: CreateUserData) {
  return prisma.user.create({
    data: {
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      documentNumber: data.documentNumber,
      jobTitle: data.jobTitle,
      phone: data.phone ?? null,
      avatarUrl: data.avatarUrl ?? null,
      teamId: data.teamId,
      hireDate: new Date(data.hireDate),
      isActive: data.isActive !== false,
      isStaff: data.isStaff ?? false,
      isSuperUser: data.isSuperUser ?? false,
      areas: data.areas?.length
        ? { create: data.areas.map((areaId) => ({ areaId })) }
        : undefined,
      groups: data.groups?.length
        ? {
            create: await Promise.all(
              data.groups.map(async (code) => {
                const group = await prisma.userGroup.findUnique({ where: { code } });
                if (!group) throw new Error(`Group ${code} not found`);
                return { groupId: group.id };
              })
            ),
          }
        : undefined,
    },
    select: { id: true, email: true, firstName: true, lastName: true, isActive: true, createdAt: true },
  });
}

export async function updateUser(id: string, data: UpdateUserData) {
  return prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id },
      data: {
        ...(data.firstName !== undefined && { firstName: data.firstName }),
        ...(data.lastName !== undefined && { lastName: data.lastName }),
        ...(data.documentNumber !== undefined && { documentNumber: data.documentNumber }),
        ...(data.jobTitle !== undefined && { jobTitle: data.jobTitle }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
        ...(data.teamId !== undefined && { teamId: data.teamId }),
        ...(data.hireDate !== undefined && { hireDate: new Date(data.hireDate) }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.isStaff !== undefined && { isStaff: data.isStaff }),
        ...(data.isSuperUser !== undefined && { isSuperUser: data.isSuperUser }),
        updatedAt: new Date(),
      },
    });

    if (data.areas !== undefined) {
      await tx.userArea.deleteMany({ where: { userId: id } });
      if (data.areas.length > 0) {
        await tx.userArea.createMany({
          data: data.areas.map((areaId) => ({ userId: id, areaId })),
          skipDuplicates: true,
        });
      }
    }

    if (data.groups !== undefined) {
      await tx.userGroupMember.deleteMany({ where: { userId: id } });
      for (const code of data.groups) {
        const group = await tx.userGroup.findUnique({ where: { code } });
        if (group) {
          await tx.userGroupMember.upsert({
            where: { userId_groupId: { userId: id, groupId: group.id } },
            update: {},
            create: { userId: id, groupId: group.id },
          });
        }
      }
    }

    return tx.user.findUnique({ where: { id }, select: userSelect });
  });
}

export async function toggleIsActive(id: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id }, select: { isActive: true } });
  return prisma.user.update({
    where: { id },
    data: {
      isActive: !user.isActive,
      deactivatedAt: user.isActive ? new Date() : null,
      updatedAt: new Date(),
    },
    select: { id: true, isActive: true, deactivatedAt: true },
  });
}

export async function getUserAreas(userId: string) {
  const areas = await prisma.userArea.findMany({
    where: { userId },
    select: { area: { select: { id: true, name: true } } },
  });
  return areas.map((a) => a.area);
}

export async function getUserGroups(userId: string): Promise<string[]> {
  const memberships = await prisma.userGroupMember.findMany({
    where: { userId },
    select: { group: { select: { code: true } } },
  });
  return memberships.map((m) => m.group.code);
}

export async function getUserProjects(userId: string) {
  return prisma.projectUser.findMany({
    where: { userId },
    select: {
      role: true,
      project: {
        select: {
          id: true,
          name: true,
          code: true,
          isActive: true,
          client: { select: { name: true } },
        },
      },
    },
  });
}
