import type { DashboardProject } from './project.schema';

// Capa anti-corrupción: traduce `projects` de v2 al contrato congelado de v1,
// preservando las claves con doble guion bajo (`__`) del `.values(...)` de Django.
// Excepción documentada a la regla de claves en español (spec `api-contract`).
//
// Es el contrato con más gaps: v2 rediseñó `projects` y eliminó varios campos de
// v1. Por decisión del change, se exponen como `null` (forma del contrato intacta):
//   status, tier, evaluation_internal, evaluation_external, image, flag_poll,
//   comments_date, category__iframe_poll.
// Categorías (Q2/Q3 diferidas): `category__name` y `category_extension__name`
// también en `null` hasta confirmar el mapeo v1↔v2 con dominio.
// Renombres aplicados: actual_start_date→real_start_date, actual_end_date→real_end_date.
interface ProjectRow {
  code: string;
  name: string;
  created_at: Date;
  start_date: Date | null;
  end_date: Date | null;
  actual_start_date: Date | null;
  actual_end_date: Date | null;
  productivity_layers: { name: string } | null;
  users: { first_name: string; last_name: string; document_number: string | null } | null;
  clients: {
    legal_name: string;
    trade_name: string | null;
    ruc: string;
    client_sectors: { name: string } | null;
    client_segmentations: { name: string } | null;
  };
}

const dateOnly = (date: Date | null) => (date ? date.toISOString().slice(0, 10) : null);

export function toDashboardProject(p: ProjectRow): DashboardProject {
  const client = p.clients;
  const manager = p.users;
  return {
    code: p.code,
    layer_productivity__name: p.productivity_layers?.name ?? null,
    name: p.name,
    client__business_name: client.trade_name ?? null,
    client__business_reason: client.legal_name,
    client__business_number: client.ruc,
    client__sector__name: client.client_sectors?.name ?? null,
    client__segmentation__name: client.client_segmentations?.name ?? null,
    start_date: dateOnly(p.start_date),
    end_date: dateOnly(p.end_date),
    real_start_date: dateOnly(p.actual_start_date),
    real_end_date: dateOnly(p.actual_end_date),
    manager__first_name: manager?.first_name ?? null,
    manager__last_name: manager?.last_name ?? null,
    manager__document_number: manager?.document_number ?? null,
    status: null,
    category__name: null,
    image: null,
    flag_poll: null,
    category_extension__name: null,
    category__iframe_poll: null,
    created_at: p.created_at.toISOString(),
    evaluation_internal: null,
    evaluation_external: null,
    tier: null,
    comments_date: null,
  };
}
