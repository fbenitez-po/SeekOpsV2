import { Router } from 'express';
import * as ctrl from './seekers.controller';

const router = Router();

// Endpoint ABIERTO (sin verifyToken/adminOnly) — replica `GET /seekers/` de v1,
// consumido por integraciones externas (BI). Ver dashboard.routes.ts para el
// hook de auth futuro.
router.get('/', ctrl.list);

export default router;
