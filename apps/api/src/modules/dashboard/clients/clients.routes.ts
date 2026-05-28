import { Router } from 'express';
import * as ctrl from './clients.controller';

const router = Router();

// Endpoint ABIERTO (sin verifyToken/adminOnly) — replica `GET /api/client/` de v1.
// Ver dashboard.routes.ts para el hook de auth futuro.
router.get('/', ctrl.list);

export default router;
