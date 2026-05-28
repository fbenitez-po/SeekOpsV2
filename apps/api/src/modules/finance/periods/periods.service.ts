import { NotFoundError } from '../../../shared/http/errorHandler';
import { logger } from '../../../shared/logging/logger';
import * as repo from './periods.repository';

export async function listUpToCurrent() {
  const now = new Date();
  return repo.findUpToCurrent(now.getFullYear(), now.getMonth() + 1);
}

export async function toggle(id: string) {
  const period = await repo.toggle(id);
  if (!period) throw new NotFoundError('Periodo no encontrado');
  logger.info({ period_id: id, is_closed: period.esta_cerrado }, 'period toggled');
  return period;
}
