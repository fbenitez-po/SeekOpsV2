import { prisma } from '../../../shared/db/prisma';

// Lectura read-only de todos los usuarios para la integración externa (BI).
// Sin paginación ni filtros: replica `User.objects.all()` de v1.
export function findAll() {
  return prisma.users.findMany({
    include: { teams: { select: { name: true } } },
    orderBy: [{ last_name: 'asc' }, { first_name: 'asc' }],
  });
}
