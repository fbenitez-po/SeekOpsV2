import type { DashboardClient } from './clients.schema';

// Capa anti-corrupción: traduce `clients` de v2 al contrato congelado de v1
// (claves en inglés del `ClientModelSerializer`). Excepción documentada a la
// regla de claves en español (spec `api-contract`), ver `migrate-dashboard-clients`.
//
// Gap de schema: v1 tiene `fiscal_address` + `legal_address`; v2 colapsó ambas
// en un único `address`. Decisión (design Q2): `fiscal_address` = address,
// `legal_address` = null. `id`/`segmentation`/`sector` se devuelven como UUID v2
// tal cual (design Q1).
interface ClientRow {
  id: string;
  legal_name: string;
  trade_name: string | null;
  ruc: string;
  address: string | null;
  segmentation_id: string;
  sector_id: string | null;
}

export function toDashboardClient(c: ClientRow): DashboardClient {
  return {
    id: c.id,
    business_reason: c.legal_name,
    business_name: c.trade_name ?? null,
    business_number: c.ruc,
    fiscal_address: c.address ?? null,
    legal_address: null,
    segmentation: c.segmentation_id,
    sector: c.sector_id ?? null,
  };
}
