import { documentedRouter } from '../../../shared/openapi';
import { DASHBOARD_TAG } from '../dashboard.openapi';
import { DashboardCommercialListSchema } from './commercial.schema';
import * as ctrl from './commercial.controller';

// Endpoint ABIERTO (sin verifyToken/adminOnly) — replica `GET /api/commercial/` de v1.
// Ver dashboard.routes.ts para el hook de auth futuro.
const docs = documentedRouter('/dashboard/commercial', DASHBOARD_TAG);

docs.get(
  '/',
  {
    summary: 'Lista de registros comerciales',
    description:
      'Devuelve los registros comerciales en el contrato congelado de v1 (claves con doble guion bajo).',
    response: DashboardCommercialListSchema,
    responseDescription: 'Array de registros comerciales',
  },
  ctrl.list,
);

export default docs.router;
