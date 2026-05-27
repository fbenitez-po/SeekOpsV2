import * as repo from './project.repository';
import * as mapper from './project.mapper';

// Devuelve un array plano (sin envoltorio de paginación), igual que v1.
export async function list() {
  const projects = await repo.findAll();
  return projects.map((p) => mapper.toDashboardProject(p));
}
