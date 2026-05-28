import { documentedRouter } from '../../../shared/openapi';
import { DASHBOARD_TAG } from '../dashboard.openapi';
import { DashboardClientListSchema } from './clients.schema';
import * as ctrl from './clients.controller';

// Endpoint ABIERTO (sin verifyToken/adminOnly) — replica `GET /api/client/` de v1.
// Ver dashboard.routes.ts para el hook de auth futuro.
const docs = documentedRouter('/dashboard/clients', DASHBOARD_TAG);

docs.get(
  '/',
  {
    summary: 'Lista de clientes',
    description: 'Devuelve todos los clientes en el contrato congelado de v1 (array plano).',
    response: DashboardClientListSchema,
    responseDescription: 'Array de clientes',
  },
  ctrl.list,
);

export default docs.router;
