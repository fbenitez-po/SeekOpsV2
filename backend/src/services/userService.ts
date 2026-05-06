import {v4 as uuidv4} from "uuid";
import {ErrorApp} from "../middlewares/errorHandler";
import * as data from "../data/userData";
import * as authData from "../data/authData";
import * as emailService from "./emailService";

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

function formatUser(u: NonNullable<Awaited<ReturnType<typeof data.findUserById>>>) {
  return {
    id: u.id,
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    documentNumber: u.documentNumber,
    jobTitle: u.jobTitle,
    phone: u.phone,
    avatarUrl: u.avatarUrl,
    isActive: u.isActive,
    isStaff: u.isStaff,
    isSuperUser: u.isSuperUser,
    team: u.team ?? null,
    areas: u.areas.map((a) => a.area),
    groups: u.groups.map((g) => g.group.code),
    hireDate: u.hireDate,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
    deactivatedAt: u.deactivatedAt,
  };
}

export async function listar(filtros: UserFilters) {
  const { users, total } = await data.listUsers(filtros);
  const limit = Math.min(parseInt(filtros.limit ?? "20"), 100);
  const page = parseInt(filtros.page ?? "1");

  return {
    data: users.map((u) => formatUser(u)),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

export async function obtenerPorId(id: string) {
  const user = await data.findUserById(id);
  if (!user) throw new ErrorApp("Usuario no encontrado", 404);

  const projects = await data.getUserProjects(id);

  return {
    ...formatUser(user),
    projects: projects.map((p) => ({
      id: p.project.id,
      name: p.project.name,
      code: p.project.code,
      clientName: p.project.client?.name ?? null,
      role: p.role,
      isActive: p.project.isActive,
    })),
  };
}

export async function crear(datos: CreateUserData) {
  if (await data.emailExists(datos.email)) {
    throw new ErrorApp("El email ya está registrado en el sistema", 400);
  }
  if (await data.documentNumberExists(datos.documentNumber)) {
    throw new ErrorApp("El número de documento ya está registrado", 400);
  }

  const hireDate = new Date(datos.hireDate);
  if (hireDate > new Date()) {
    throw new ErrorApp("hireDate no puede ser futura", 400);
  }

  if (!datos.areas || datos.areas.length === 0) {
    throw new ErrorApp("Debe seleccionar al menos un área", 400);
  }

  const usuario = await data.createUser(datos);

  const token = uuidv4();
  const expiracion = new Date(Date.now() + 48 * 60 * 60 * 1000);
  await authData.savePasswordResetToken(usuario.id, token, expiracion);
  await emailService.enviarBienvenida(usuario.email, usuario.firstName, token);

  return usuario;
}

export async function actualizar(id: string, datos: UpdateUserData) {
  const existe = await data.findUserById(id);
  if (!existe) throw new ErrorApp("Usuario no encontrado", 404);

  if (datos.documentNumber && (await data.documentNumberExists(datos.documentNumber, id))) {
    throw new ErrorApp("documentNumber ya está en uso por otro usuario", 400);
  }

  if (datos.areas !== undefined && datos.areas.length === 0) {
    throw new ErrorApp("Debe seleccionar al menos un área", 400);
  }

  return data.updateUser(id, datos);
}

export async function toggleActivo(id: string) {
  const existe = await data.findUserById(id);
  if (!existe) throw new ErrorApp("Usuario no encontrado", 404);
  return data.toggleIsActive(id);
}
