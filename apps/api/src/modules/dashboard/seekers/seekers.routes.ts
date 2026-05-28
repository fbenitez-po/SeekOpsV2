import { documentedRouter } from '../../../shared/openapi';
import { DASHBOARD_TAG } from '../dashboard.openapi';
import { DashboardSeekerListSchema } from './seekers.schema';
import * as ctrl from './seekers.controller';

// Endpoint ABIERTO (sin verifyToken/adminOnly) — replica `GET /seekers/` de v1,
// consumido por integraciones externas (BI). Ver dashboard.routes.ts para el
// hook de auth futuro.
const docs = documentedRouter('/dashboard/seekers', DASHBOARD_TAG);

docs.get(
  '/',
  {
    summary: 'Lista de seekers',
    description: 'Devuelve todos los seekers en el contrato congelado de v1 (array plano).',
    response: DashboardSeekerListSchema,
    responseDescription: 'Array de seekers',
  },
  ctrl.list,
);

export default docs.router;
