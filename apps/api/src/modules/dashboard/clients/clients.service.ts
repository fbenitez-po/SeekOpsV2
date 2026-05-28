import * as repo from './clients.repository';
import * as mapper from './clients.mapper';

// Devuelve un array plano (sin envoltorio de paginación), igual que v1.
export async function list() {
  const clients = await repo.findAll();
  return clients.map((c) => mapper.toDashboardClient(c));
}
