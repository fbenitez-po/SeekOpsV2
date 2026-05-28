import { Router } from 'express';
import seekersRoutes from './seekers/seekers.routes';
import clientsRoutes from './clients/clients.routes';
import commercialRoutes from './commercial/commercial.routes';
import projectRoutes from './project/project.routes';

const router = Router();

// Módulo "dashboard": superficie de integración externa (BI / dashboards),
// read-only y abierta, que replica la "API Dashboard" de v1.
//
// Hook de auth (pendiente): si en el futuro se decide proteger esta superficie
// (p. ej. con un token compartido al estilo `require_token(?token=...)` de v1),
// montar aquí un `router.use(dashboardAuth)` único — sin tocar los sub-recursos.
router.use('/seekers', seekersRoutes);
router.use('/clients', clientsRoutes);
router.use('/commercial', commercialRoutes);
router.use('/project', projectRoutes);

export default router;
