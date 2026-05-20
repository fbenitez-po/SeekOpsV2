import { env } from '../../src/shared/config/env';

export const API_PREFIX = env.API_PREFIX;

export function apiPath(path: string): string {
  return `${API_PREFIX}${path.startsWith('/') ? path : `/${path}`}`;
}
