import { prisma } from '../../../shared/db/prisma';

// Lectura read-only y desnormalizada de los proyectos para BI.
// Sin paginación: replica `Project.objects...order_by('-created_at')` de v1.
// El `users` es el `manager` (gestor). No se incluye `project_project_category`
// porque las claves de categoría quedan en `null` mientras Q2/Q3 estén diferidas
// (ver design de `migrate-dashboard-project`).
export function findAll() {
  return prisma.projects.findMany({
    select: {
      code: true,
      name: true,
      created_at: true,
      start_date: true,
      end_date: true,
      actual_start_date: true,
      actual_end_date: true,
      productivity_layers: { select: { name: true } },
      users: { select: { first_name: true, last_name: true, document_number: true } },
      clients: {
        select: {
          legal_name: true,
          trade_name: true,
          ruc: true,
          client_sectors: { select: { name: true } },
          client_segmentations: { select: { name: true } },
        },
      },
    },
    orderBy: { created_at: 'desc' },
  });
}
