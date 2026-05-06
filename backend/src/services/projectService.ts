import {ProjectRole} from "@prisma/client";
import {ErrorApp} from "../middlewares/errorHandler";
import * as data from "../data/projectData";

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
  managerId: string;
  segmentationId?: string;
  productivityLayerId?: string;
  serviceTypeId?: string;
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
  managerId?: string;
  segmentationId?: string;
  productivityLayerId?: string;
  serviceTypeId?: string;
  areaId?: string | null;
  startDate?: string | Date;
  endDate?: string | Date;
  isActive?: boolean;
  categoryIds?: string[];
}

export async function listar(filtros: ProjectFilters, userId: string, roles: string[]) {
  const { projects, total } = await data.listProjects(filtros, userId, roles);
  const limit = Math.min(parseInt(filtros.limit ?? "20"), 100);
  const page = parseInt(filtros.page ?? "1");

  return {
    data: projects.map((p) => ({
      id: p.id,
      code: p.code,
      name: p.name,
      description: p.description,
      isActive: p.isActive,
      startDate: p.startDate,
      endDate: p.endDate,
      client: p.client,
      manager: p.manager,
      segmentation: p.segmentation,
      serviceType: p.serviceType,
      area: p.area,
      membersCount: p._count.members,
    })),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

export async function obtenerPorId(id: string, userId: string, roles: string[]) {
  const project = await data.findProjectById(id);
  if (!project) throw new ErrorApp("Proyecto no encontrado", 404);

  if (!roles.includes("ADMIN")) {
    const members = await data.getProjectMembers(id);
    const hasAccess = project.manager?.id === userId || members.some((m) => m.user.id === userId);
    if (!hasAccess) throw new ErrorApp("No tenés acceso a este proyecto", 403);
  }

  const members = await data.getProjectMembers(id);
  return {
    id: project.id,
    code: project.code,
    name: project.name,
    description: project.description,
    isActive: project.isActive,
    startDate: project.startDate,
    endDate: project.endDate,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    client: project.client,
    manager: project.manager,
    segmentation: project.segmentation,
    productivityLayer: project.productivityLayer,
    serviceType: project.serviceType,
    area: project.area,
    categories: project.categories.map((c) => c.category),
    members: members.map((m) => ({
      id: m.user.id,
      firstName: m.user.firstName,
      lastName: m.user.lastName,
      email: m.user.email,
      avatarUrl: m.user.avatarUrl,
      role: m.role,
    })),
  };
}

export async function crear(datos: CreateProjectData) {
  if (await data.codeExists(datos.code)) {
    throw new ErrorApp("El código de proyecto ya existe", 400);
  }

  if (datos.startDate && datos.endDate && new Date(datos.endDate) < new Date(datos.startDate)) {
    throw new ErrorApp("endDate no puede ser anterior a startDate", 400);
  }

  const gestorValido = await data.userHasManagerRole(datos.managerId);
  if (!gestorValido) {
    throw new ErrorApp("El gestor indicado no tiene rol de Gestor activo", 400);
  }

  return data.createProject(datos);
}

export async function actualizar(id: string, datos: UpdateProjectData) {
  const existe = await data.findProjectById(id);
  if (!existe) throw new ErrorApp("Proyecto no encontrado", 404);

  if (datos.code && (await data.codeExists(datos.code, id))) {
    throw new ErrorApp("El código de proyecto ya existe", 400);
  }

  const startDate = datos.startDate ?? existe.startDate;
  const endDate = datos.endDate ?? existe.endDate;
  if (startDate && endDate && new Date(endDate as string) < new Date(startDate as string)) {
    throw new ErrorApp("endDate no puede ser anterior a startDate", 400);
  }

  return data.updateProject(id, datos);
}

export async function toggleActivo(id: string) {
  const existe = await data.findProjectById(id);
  if (!existe) throw new ErrorApp("Proyecto no encontrado", 404);
  return data.toggleIsActive(id);
}

export async function asignarUsuarios(
  id: string,
  usuarios: Array<{ userId: string; role: ProjectRole }>
) {
  const existe = await data.findProjectById(id);
  if (!existe) throw new ErrorApp("Proyecto no encontrado", 404);

  const rolesValidos: ProjectRole[] = ["SEEKER", "MANAGER"];
  for (const u of usuarios) {
    if (!rolesValidos.includes(u.role)) {
      throw new ErrorApp("role debe ser SEEKER o MANAGER", 400);
    }
  }

  const resultado = await data.assignUsers(id, usuarios);
  return { projectId: id, ...resultado };
}

export async function desasignarUsuario(projectId: string, userId: string) {
  const removed = await data.removeUser(projectId, userId);
  if (!removed) throw new ErrorApp("El usuario no está asignado a este proyecto", 404);
}
