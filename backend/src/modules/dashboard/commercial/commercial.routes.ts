import { Router } from 'express';
import * as ctrl from './commercial.controller';

const router = Router();

// Endpoint ABIERTO (sin verifyToken/adminOnly) — replica `GET /api/commercial/` de v1.
// Ver dashboard.routes.ts para el hook de auth futuro.
router.get('/', ctrl.list);

export default router;
