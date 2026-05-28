import type { DashboardSeeker } from './seekers.schema';

// Capa anti-corrupción: traduce el schema interno de v2 al contrato congelado
// de v1 (claves en inglés del `SeekerSerializer`). Es una excepción consciente
// a la regla del spec `api-contract` (claves en español), documentada en el
// change `migrate-dashboard-seekers`.
interface SeekerRow {
  email: string;
  first_name: string;
  last_name: string;
  position: string | null;
  mobile_phone: string | null;
  document_number: string | null;
  is_active: boolean;
  teams?: { name: string } | null;
}

export function toSeeker(u: SeekerRow): DashboardSeeker {
  return {
    email: u.email,
    first_name: u.first_name,
    last_name: u.last_name,
    job: u.position ?? null,
    cellphone: u.mobile_phone ?? null,
    document_number: u.document_number ?? null,
    team: u.teams?.name ?? null,
    is_active: u.is_active,
  };
}
