import * as repo from './commercial.repository';
import * as mapper from './commercial.mapper';

// Devuelve un array plano (sin envoltorio de paginación), igual que v1.
export async function list() {
  const records = await repo.findAll();
  return records.map((r) => mapper.toDashboardCommercial(r));
}
