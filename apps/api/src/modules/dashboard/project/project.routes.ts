import { documentedRouter } from '../../../shared/openapi';
import { DASHBOARD_TAG } from '../dashboard.openapi';
import { DashboardProjectListSchema } from './project.schema';
import * as ctrl from './project.controller';

// Endpoint ABIERTO (sin verifyToken/adminOnly) — replica `GET /api/project/` de v1.
// Ver dashboard.routes.ts para el hook de auth futuro.
const docs = documentedRouter('/dashboard/project', DASHBOARD_TAG);

docs.get(
  '/',
  {
    summary: 'Lista de proyectos',
    description: 'Devuelve los proyectos en el contrato congelado de v1 (claves con doble guion bajo).',
    response: DashboardProjectListSchema,
    responseDescription: 'Array de proyectos',
  },
  ctrl.list,
);

export default docs.router;
