import {ErrorApp} from "../middlewares/errorHandler";
import * as data from "../data/clientData";

interface ClientFilters {
  isActive?: string;
  search?: string;
  categoryId?: string;
  segmentationId?: string;
  sectorId?: string;
  limit?: string;
  page?: string;
}

interface CreateClientData {
  name: string;
  legalName?: string;
  commercialName?: string;
  taxId: string;
  contactName?: string;
  contactEmail?: string;
  phone?: string;
  address?: string;
  categoryId: string;
  segmentationId: string;
  sectorId?: string;
}

interface UpdateClientData {
  name?: string;
  legalName?: string;
  commercialName?: string;
  taxId?: string;
  contactName?: string;
  contactEmail?: string;
  phone?: string;
  address?: string;
  categoryId?: string;
  segmentationId?: string;
  sectorId?: string;
}

export async function listar(filtros: ClientFilters) {
  const { clients, total } = await data.listClients(filtros);
  const limit = Math.min(parseInt(filtros.limit ?? "20"), 100);
  const page = parseInt(filtros.page ?? "1");

  return {
    data: clients,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

export async function obtenerPorId(id: string) {
  const client = await data.findClientById(id);
  if (!client) throw new ErrorApp("Cliente no encontrado", 404);
  return client;
}

export async function crear(datos: CreateClientData) {
  if (await data.taxIdExists(datos.taxId)) {
    throw new ErrorApp("El RUC/Tax ID ya está registrado en otro cliente", 400);
  }
  return data.createClient(datos);
}

export async function actualizar(id: string, datos: UpdateClientData) {
  const existe = await data.findClientById(id);
  if (!existe) throw new ErrorApp("Cliente no encontrado", 404);

  if (datos.taxId && (await data.taxIdExists(datos.taxId, id))) {
    throw new ErrorApp("El RUC/Tax ID ya está en uso por otro cliente", 400);
  }

  return data.updateClient(id, datos);
}

export async function toggleActivo(id: string) {
  const existe = await data.findClientById(id);
  if (!existe) throw new ErrorApp("Cliente no encontrado", 404);
  return data.toggleIsActive(id);
}
