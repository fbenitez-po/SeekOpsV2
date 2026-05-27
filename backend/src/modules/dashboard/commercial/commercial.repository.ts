import { prisma } from '../../../shared/db/prisma';

// Lectura read-only y desnormalizada de los registros comerciales para BI.
// Sin paginación: replica `Commercial.objects...order_by('-created_at')` de v1.
// El `users` de nivel superior es el `owner` (responsable); el `users` dentro de
// `projects` es el `manager` (gestor del proyecto).
export function findAll() {
  return prisma.commercial_records.findMany({
    select: {
      record_date: true,
      detail: true,
      price: true,
      currency: true,
      has_contract: true,
      is_billed: true,
      document_types: { select: { name: true } },
      users: { select: { first_name: true, last_name: true, document_number: true } },
      projects: {
        select: {
          name: true,
          code: true,
          users: { select: { first_name: true } },
          clients: {
            select: {
              legal_name: true,
              trade_name: true,
              ruc: true,
              client_sectors: { select: { name: true } },
              client_segmentations: { select: { name: true } },
            },
          },
          project_project_category: {
            select: { project_categories: { select: { name: true } } },
          },
        },
      },
    },
    orderBy: { created_at: 'desc' },
  });
}
