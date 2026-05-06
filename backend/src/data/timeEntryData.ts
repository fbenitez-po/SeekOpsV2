import {prisma} from "../lib/prisma";
import {Prisma, TimeEntryStatus} from "@prisma/client";

interface TimeEntryFilters {
  status?: TimeEntryStatus;
  week?: string;
  userId?: string;
  projectId?: string;
  limit?: string;
  page?: string;
}

interface CreateLineData {
  projectId: string;
  incomeCategoryId?: string;
  hours: number;
  extraHours?: number;
  comment?: string;
}

interface CreateTimeEntryData {
  userId: string;
  week: string;
  status: TimeEntryStatus;
  lines: CreateLineData[];
}

interface UpdateLineData {
  id: string;
  hours: number;
  extraHours?: number;
  comment?: string;
}

interface RegisterApprovalData {
  timeEntryId: string;
  action: TimeEntryStatus;
  userId: string;
  comment?: string;
  suggestedHours?: number;
  suggestedExtraHours?: number;
  rejectionReason?: string;
  allowResubmit?: boolean;
}

export async function listTimeEntries(
  { userId, roles, filters }: { userId: string; roles: string[]; filters: TimeEntryFilters }
) {
  const limit = Math.min(parseInt(filters.limit ?? "20"), 100);
  const page = parseInt(filters.page ?? "1");
  const offset = (page - 1) * limit;

  const where: Prisma.TimeEntryWhereInput = {};

  if (roles.includes("ADMIN")) {
    // no user restriction
  } else if (roles.includes("MANAGER")) {
    where.OR = [
      { userId },
      { lines: { some: { project: { managerId: userId } } } },
    ];
  } else {
    where.userId = userId;
  }

  if (filters.status) where.status = filters.status;
  if (filters.week) where.week = filters.week;
  if (filters.userId && roles.includes("ADMIN")) where.userId = filters.userId;
  if (filters.projectId) {
    where.lines = { some: { projectId: filters.projectId } };
  }

  const [entries, total] = await prisma.$transaction([
    prisma.timeEntry.findMany({
      where,
      select: {
        id: true,
        week: true,
        status: true,
        createdAt: true,
        user: { select: { id: true, firstName: true, lastName: true } },
      },
      skip: offset,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.timeEntry.count({ where }),
  ]);

  return { entries, total };
}

export async function findTimeEntryById(id: string) {
  return prisma.timeEntry.findUnique({
    where: { id },
    select: {
      id: true,
      week: true,
      status: true,
      userId: true,
      createdAt: true,
      updatedAt: true,
      user: { select: { firstName: true, lastName: true } },
    },
  });
}

export async function getTimeEntryLines(timeEntryId: string) {
  return prisma.timeEntryLine.findMany({
    where: { timeEntryId },
    select: {
      id: true,
      projectId: true,
      incomeCategoryId: true,
      hours: true,
      extraHours: true,
      comment: true,
      project: { select: { name: true, code: true } },
      incomeCategory: { select: { name: true } },
    },
  });
}

export async function getTimeEntryApprovals(timeEntryId: string) {
  return prisma.timeEntryApproval.findMany({
    where: { timeEntryId },
    select: {
      id: true,
      action: true,
      comment: true,
      suggestedHours: true,
      suggestedExtraHours: true,
      rejectionReason: true,
      allowResubmit: true,
      createdAt: true,
      createdByUser: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function verifyProjectAssignment(userId: string, projectId: string) {
  const membership = await prisma.projectUser.findFirst({ where: { userId, projectId } });
  if (membership) return true;
  const isManager = await prisma.project.findFirst({ where: { id: projectId, managerId: userId } });
  return !!isManager;
}

export async function findExistingEntry(userId: string, week: string) {
  return prisma.timeEntry.findFirst({
    where: { userId, week, status: { in: ["PENDING", "APPROVED"] } },
    select: { id: true },
  });
}

export async function isProjectManager(userId: string, projectId: string) {
  const project = await prisma.project.findFirst({ where: { id: projectId, managerId: userId } });
  return !!project;
}

export async function createTimeEntry(data: CreateTimeEntryData) {
  return prisma.$transaction(async (tx) => {
    const entry = await tx.timeEntry.create({
      data: {
        userId: data.userId,
        week: data.week,
        status: data.status,
        createdByUserId: data.userId,
        updatedByUserId: data.userId,
        lines: {
          create: data.lines.map((line) => ({
            projectId: line.projectId,
            incomeCategoryId: line.incomeCategoryId ?? null,
            hours: line.hours,
            extraHours: line.extraHours ?? 0,
            comment: line.comment ?? "",
          })),
        },
      },
      select: {
        id: true,
        week: true,
        status: true,
        createdAt: true,
        lines: {
          select: {
            id: true,
            projectId: true,
            incomeCategoryId: true,
            hours: true,
            extraHours: true,
            comment: true,
          },
        },
      },
    });
    return entry;
  });
}

export async function updateTimeEntryLines(
  timeEntryId: string,
  lines: UpdateLineData[],
  userId: string
) {
  return prisma.$transaction(async (tx) => {
    for (const line of lines) {
      await tx.timeEntryLine.updateMany({
        where: { id: line.id, timeEntryId },
        data: {
          hours: line.hours,
          extraHours: line.extraHours ?? 0,
          comment: line.comment ?? "",
          updatedAt: new Date(),
        },
      });
    }

    return tx.timeEntry.update({
      where: { id: timeEntryId },
      data: { status: "PENDING", updatedAt: new Date(), updatedByUserId: userId },
      select: { id: true, week: true, status: true, updatedAt: true },
    });
  });
}

export async function registerApproval(data: RegisterApprovalData) {
  return prisma.$transaction(async (tx) => {
    await tx.timeEntry.update({
      where: { id: data.timeEntryId },
      data: { status: data.action, updatedAt: new Date(), updatedByUserId: data.userId },
    });

    await tx.timeEntryApproval.create({
      data: {
        timeEntryId: data.timeEntryId,
        action: data.action,
        comment: data.comment ?? null,
        suggestedHours: data.suggestedHours ?? null,
        suggestedExtraHours: data.suggestedExtraHours ?? null,
        rejectionReason: data.rejectionReason ?? null,
        allowResubmit: data.allowResubmit ?? false,
        createdByUserId: data.userId,
      },
    });

    return data.action;
  });
}

export async function getUserHireDate(userId: string) {
  return prisma.user.findUnique({ where: { id: userId }, select: { hireDate: true } });
}

export async function getLoadedWeeks(userId: string) {
  const entries = await prisma.timeEntry.findMany({
    where: { userId },
    select: { week: true },
    distinct: ["week"],
  });
  return entries.map((e) => e.week);
}
