import { Router } from 'express';
import seekersRoutes from './seekers/seekers.routes';

const router = Router();

// Módulo "dashboard": superficie de integración externa (BI / dashboards),
// read-only y abierta, que replica la "API Dashboard" de v1.
//
// Hook de auth (pendiente): si en el futuro se decide proteger esta superficie
// (p. ej. con un token compartido al estilo `require_token(?token=...)` de v1),
// montar aquí un `router.use(dashboardAuth)` único — sin tocar los sub-recursos.
router.use('/seekers', seekersRoutes);

export default router;
