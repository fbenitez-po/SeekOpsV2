// Capa anti-corrupción: traduce `commercial_records` de v2 al contrato congelado
// de v1, preservando las claves con doble guion bajo (`__`) que produce el
// `.values(...)` de Django. Excepción documentada a la regla de claves en
// español (spec `api-contract`), ver `migrate-dashboard-commercial`.
//
// Gaps de schema (design Q1) → `null`: `type` (Recurrente/Proyecto/Renovación),
// `division__name` (v2 no tiene `divisions`) y `duration` (semanas).
// `project__category__name`: v1 era FK única; en v2 es M2M → se toma la primera
// categoría asociada o `null` (design Q2).
interface CommercialRow {
  record_date: Date;
  detail: string | null;
  price: unknown;
  currency: string;
  has_contract: boolean;
  is_billed: boolean;
  document_types: { name: string } | null;
  users: { first_name: string; last_name: string; document_number: string | null };
  projects: {
    name: string;
    code: string;
    users: { first_name: string } | null;
    clients: {
      legal_name: string;
      trade_name: string | null;
      ruc: string;
      client_sectors: { name: string } | null;
      client_segmentations: { name: string } | null;
    };
    project_project_category: { project_categories: { name: string } }[];
  };
}

export function toDashboardCommercial(c: CommercialRow) {
  const client = c.projects.clients;
  return {
    date: c.record_date.toISOString().slice(0, 10),
    detail: c.detail ?? null,
    price: Number(c.price),
    coin: c.currency,
    type: null,
    document: c.document_types?.name ?? null,
    status: c.has_contract,
    billing: c.is_billed,
    division__name: null,
    project__name: c.projects.name,
    project__code: c.projects.code,
    project__client__business_name: client.trade_name ?? null,
    project__client__business_number: client.ruc,
    project__client__business_reason: client.legal_name,
    project__client__sector__name: client.client_sectors?.name ?? null,
    project__client__segmentation__name: client.client_segmentations?.name ?? null,
    project__category__name: c.projects.project_project_category[0]?.project_categories?.name ?? null,
    project__manager__first_name: c.projects.users?.first_name ?? null,
    responsible__first_name: c.users.first_name,
    responsible__last_name: c.users.last_name,
    responsible__document_number: c.users.document_number ?? null,
    duration: null,
  };
}
