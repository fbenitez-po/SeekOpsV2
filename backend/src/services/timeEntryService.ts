import {TimeEntryStatus} from "@prisma/client";
import {ErrorApp} from "../middlewares/errorHandler";
import * as data from "../data/timeEntryData";

interface TimeEntryFilters {
  status?: string;
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

interface UpdateLineData {
  id: string;
  hours: number;
  extraHours?: number;
  comment?: string;
}

function buildEntry(
  entry: { id: string; week: string; status: TimeEntryStatus; createdAt: Date; userId: string; user: { firstName: string; lastName: string } },
  lines: Awaited<ReturnType<typeof data.getTimeEntryLines>>,
  approvals: Awaited<ReturnType<typeof data.getTimeEntryApprovals>>
) {
  const totalHours = lines.reduce((s, l) => s + l.hours, 0);
  const totalExtraHours = lines.reduce((s, l) => s + (l.extraHours ?? 0), 0);

  return {
    id: entry.id,
    week: entry.week,
    status: entry.status,
    createdAt: entry.createdAt,
    userId: entry.userId,
    user: entry.user,
    lines: lines.map((l) => ({
      id: l.id,
      project: { id: l.projectId, name: l.project.name, code: l.project.code },
      incomeCategory: l.incomeCategoryId
        ? { id: l.incomeCategoryId, name: l.incomeCategory?.name ?? null }
        : null,
      hours: l.hours,
      extraHours: l.extraHours,
      comment: l.comment,
    })),
    totalHours,
    totalExtraHours,
    approvals: approvals.map((a) => ({
      id: a.id,
      action: a.action,
      comment: a.comment,
      suggestedHours: a.suggestedHours,
      suggestedExtraHours: a.suggestedExtraHours,
      rejectionReason: a.rejectionReason,
      allowResubmit: a.allowResubmit,
      createdAt: a.createdAt,
      createdBy: a.createdByUser,
    })),
  };
}

export async function listar(
  userId: string,
  roles: string[],
  filtros: TimeEntryFilters
) {
  const validStatus = filtros.status as TimeEntryStatus | undefined;
  const { entries, total } = await data.listTimeEntries({
    userId,
    roles,
    filters: { ...filtros, status: validStatus },
  });

  const limit = Math.min(parseInt(filtros.limit ?? "20"), 100);
  const page = parseInt(filtros.page ?? "1");

  const entriesWithDetail = await Promise.all(
    entries.map(async (e) => {
      const [lines, approvals] = await Promise.all([
        data.getTimeEntryLines(e.id),
        data.getTimeEntryApprovals(e.id),
      ]);
      return buildEntry({ ...e, userId: (e as any).userId ?? userId }, lines, approvals);
    })
  );

  return {
    data: entriesWithDetail,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

export async function obtenerPorId(id: string, userId: string, roles: string[]) {
  const entry = await data.findTimeEntryById(id);
  if (!entry) throw new ErrorApp("Registro no encontrado", 404);

  const isOwner = entry.userId === userId;
  const isAdmin = roles.includes("ADMIN");

  if (!isOwner && !isAdmin) {
    const lines = await data.getTimeEntryLines(id);
    if (lines.length > 0) {
      const isManager = await data.isProjectManager(userId, lines[0].projectId);
      if (!isManager) throw new ErrorApp("No tenés permiso para ver este registro", 403);
    }
  }

  const [lines, approvals] = await Promise.all([
    data.getTimeEntryLines(id),
    data.getTimeEntryApprovals(id),
  ]);

  return buildEntry(entry, lines, approvals);
}

export async function crear(userId: string, roles: string[], body: { week: string; lines: CreateLineData[] }) {
  const { week, lines } = body;

  if (!lines || lines.length === 0) {
    throw new ErrorApp("Debe incluir al menos una línea", 400);
  }

  const projectIds = lines.map((l) => l.projectId);
  if (new Set(projectIds).size !== projectIds.length) {
    throw new ErrorApp("No se puede repetir el mismo proyecto en una carga", 400);
  }

  const existing = await data.findExistingEntry(userId, week);
  if (existing) {
    throw new ErrorApp(`Ya existe un registro para la semana ${week} en estado PENDING o APPROVED`, 400);
  }

  for (const line of lines) {
    if (line.hours < 0) throw new ErrorApp("hours debe ser mayor o igual a 0", 400);
    if (line.extraHours !== undefined && (line.extraHours < 0 || line.extraHours > 8)) {
      throw new ErrorApp("extraHours debe ser entre 0 y 8", 400);
    }
    const assigned = await data.verifyProjectAssignment(userId, line.projectId);
    if (!assigned) throw new ErrorApp("No tenés acceso al proyecto indicado", 403);
  }

  const isManager = roles.includes("MANAGER") && !roles.includes("SEEKER");
  const status: TimeEntryStatus = isManager ? "APPROVED" : "PENDING";

  return data.createTimeEntry({ userId, week, status, lines });
}

export async function ajustar(id: string, userId: string, lines: UpdateLineData[]) {
  const entry = await data.findTimeEntryById(id);
  if (!entry) throw new ErrorApp("Registro no encontrado", 404);
  if (entry.userId !== userId) throw new ErrorApp("Solo el dueño del registro puede editarlo", 403);
  if (entry.status !== "OBSERVED") throw new ErrorApp("Solo se pueden editar registros en estado OBSERVED", 403);

  for (const line of lines) {
    if (line.hours < 0) throw new ErrorApp("hours debe ser mayor o igual a 0", 400);
    if (line.extraHours !== undefined && (line.extraHours < 0 || line.extraHours > 8)) {
      throw new ErrorApp("extraHours debe ser entre 0 y 8", 400);
    }
  }

  return data.updateTimeEntryLines(id, lines, userId);
}

export async function aprobar(id: string, userId: string, roles: string[]) {
  const entry = await data.findTimeEntryById(id);
  if (!entry) throw new ErrorApp("Registro no encontrado", 404);
  if (entry.status !== "PENDING") throw new ErrorApp("Solo se pueden aprobar registros en estado PENDING", 403);

  if (!roles.includes("ADMIN")) {
    const lines = await data.getTimeEntryLines(id);
    if (!lines.length) throw new ErrorApp("Registro no encontrado", 404);
    const isManager = await data.isProjectManager(userId, lines[0].projectId);
    if (!isManager) throw new ErrorApp("Solo el gestor del proyecto o un administrador puede aprobar", 403);
  }

  await data.registerApproval({ timeEntryId: id, action: "APPROVED", userId });
  return { id, status: "APPROVED", approvedAt: new Date().toISOString() };
}

export async function observar(
  id: string,
  userId: string,
  roles: string[],
  datos: { comment: string; suggestedHours?: number; suggestedExtraHours?: number }
) {
  const entry = await data.findTimeEntryById(id);
  if (!entry) throw new ErrorApp("Registro no encontrado", 404);
  if (entry.status !== "PENDING") throw new ErrorApp("Solo se pueden observar registros en estado PENDING", 403);

  if (!datos.comment) throw new ErrorApp("comment es requerido", 400);

  if (!roles.includes("ADMIN")) {
    const lines = await data.getTimeEntryLines(id);
    const isManager = lines.length > 0 && (await data.isProjectManager(userId, lines[0].projectId));
    if (!isManager) throw new ErrorApp("Solo el gestor del proyecto o un administrador puede observar", 403);
  }

  await data.registerApproval({ timeEntryId: id, action: "OBSERVED", userId, ...datos });
  return { id, status: "OBSERVED", observedAt: new Date().toISOString(), ...datos };
}

export async function rechazar(
  id: string,
  userId: string,
  roles: string[],
  datos: { rejectionReason: string; allowResubmit?: boolean }
) {
  const entry = await data.findTimeEntryById(id);
  if (!entry) throw new ErrorApp("Registro no encontrado", 404);
  if (entry.status !== "PENDING") throw new ErrorApp("Solo se pueden rechazar registros en estado PENDING", 403);

  if (!datos.rejectionReason) throw new ErrorApp("rejectionReason es requerida", 400);

  if (!roles.includes("ADMIN")) {
    const lines = await data.getTimeEntryLines(id);
    const isManager = lines.length > 0 && (await data.isProjectManager(userId, lines[0].projectId));
    if (!isManager) throw new ErrorApp("Solo el gestor del proyecto o un administrador puede rechazar", 403);
  }

  await data.registerApproval({ timeEntryId: id, action: "REJECTED", userId, ...datos });
  return { id, status: "REJECTED", rejectedAt: new Date().toISOString(), ...datos };
}

function calcWeekCode(date: Date): string {
  const start = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date.getTime() - start.getTime()) / 86400000);
  const week = Math.ceil((days + start.getDay() + 1) / 7);
  const year = String(date.getFullYear()).slice(-2);
  return `S${String(week).padStart(2, "0")}/${year}`;
}

function nextSunday(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  if (day !== 0) d.setDate(d.getDate() + (7 - day));
  return d;
}

export async function obtenerSemanasSinCarga(userId: string) {
  const [userRow, loadedWeeks] = await Promise.all([
    data.getUserHireDate(userId),
    data.getLoadedWeeks(userId),
  ]);

  if (!userRow?.hireDate) return { weeks: [], total: 0 };

  const loadedSet = new Set(loadedWeeks);
  const cursor = nextSunday(new Date(userRow.hireDate));
  const lastCompletedSunday = nextSunday(new Date());
  lastCompletedSunday.setDate(lastCompletedSunday.getDate() - 7);

  const missing: string[] = [];
  while (cursor <= lastCompletedSunday) {
    const code = calcWeekCode(cursor);
    if (!loadedSet.has(code)) missing.push(code);
    cursor.setDate(cursor.getDate() + 7);
  }

  return { weeks: missing, total: missing.length };
}
