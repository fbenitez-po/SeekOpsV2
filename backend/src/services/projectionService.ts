import {ErrorApp} from "../middlewares/errorHandler";
import * as data from "../data/projectionData";
import * as projectData from "../data/projectData";

interface ProjectionFilters {
  projectId?: string;
  userId?: string;
}

interface CreateProjectionData {
  projectId: string;
  userId: string;
  startDate: string | Date;
  endDate: string | Date;
  projectedHours: number;
  notes?: string;
}

interface UpdateProjectionData {
  startDate?: string | Date;
  endDate?: string | Date;
  projectedHours?: number;
  notes?: string;
}

export async function listar(filtros: ProjectionFilters, managerId: string, roles: string[]) {
  return data.listProjections(filtros, managerId, roles);
}

export async function crear(body: CreateProjectionData, managerId: string, roles: string[]) {
  const { projectId, userId, startDate, endDate, projectedHours } = body;

  if (!projectId || !userId || !startDate || !endDate || !projectedHours) {
    throw new ErrorApp("projectId, userId, startDate, endDate y projectedHours son requeridos");
  }

  if (new Date(endDate) < new Date(startDate)) {
    throw new ErrorApp("endDate debe ser mayor o igual a startDate");
  }

  if (projectedHours <= 0) {
    throw new ErrorApp("projectedHours debe ser mayor a 0");
  }

  if (!roles.includes("ADMIN")) {
    const project = await projectData.findProjectById(projectId);
    if (!project || project.manager?.id !== managerId) {
      throw new ErrorApp("No tenés permisos para proyectar horas en este proyecto", 403);
    }
  }

  const created = await data.createProjection(body, managerId);
  return data.findProjectionById(created.id);
}

export async function actualizar(
  id: string,
  body: UpdateProjectionData,
  managerId: string,
  roles: string[]
) {
  const existing = await data.findProjectionById(id);
  if (!existing) throw new ErrorApp("Proyección no encontrada", 404);

  if (!roles.includes("ADMIN") && existing.project.managerId !== managerId) {
    throw new ErrorApp("No tenés permisos para modificar esta proyección", 403);
  }

  const { startDate, endDate, projectedHours } = body;

  if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
    throw new ErrorApp("endDate debe ser mayor o igual a startDate");
  }

  if (projectedHours !== undefined && projectedHours <= 0) {
    throw new ErrorApp("projectedHours debe ser mayor a 0");
  }

  await data.updateProjection(id, body, managerId);
  return data.findProjectionById(id);
}

export async function eliminar(id: string, managerId: string, roles: string[]) {
  const existing = await data.findProjectionById(id);
  if (!existing) throw new ErrorApp("Proyección no encontrada", 404);

  if (!roles.includes("ADMIN") && existing.project.managerId !== managerId) {
    throw new ErrorApp("No tenés permisos para eliminar esta proyección", 403);
  }

  await data.deleteProjection(id);
  return { message: "Proyección eliminada correctamente" };
}

export async function listarAlertas(managerId: string, roles: string[]) {
  const rows = await data.listAlerts(managerId, roles);
  return rows.map((r) => ({
    timeEntryId: r.time_entry_id,
    week: r.week,
    status: r.status,
    createdAt: r.created_at,
    userId: r.user_id,
    firstName: r.first_name,
    lastName: r.last_name,
    projectId: r.project_id,
    projectName: r.project_name,
    hoursLoaded: Number(r.hours_loaded),
  }));
}
