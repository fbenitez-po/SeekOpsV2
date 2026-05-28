import { prisma } from '../../../shared/db/prisma';

// Lectura read-only de todos los clientes para la integración externa (BI).
// Sin paginación: replica `Client.objects.all().order_by('-created_at')` de v1.
export function findAll() {
  return prisma.clients.findMany({
    select: {
      id: true,
      legal_name: true,
      trade_name: true,
      ruc: true,
      address: true,
      segmentation_id: true,
      sector_id: true,
    },
    orderBy: { created_at: 'desc' },
  });
}
