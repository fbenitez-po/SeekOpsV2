import * as repo from './seekers.repository';
import * as mapper from './seekers.mapper';

// Devuelve un array plano (sin envoltorio de paginación), igual que v1.
export async function list() {
  const users = await repo.findAll();
  return users.map((u) => mapper.toSeeker(u));
}
