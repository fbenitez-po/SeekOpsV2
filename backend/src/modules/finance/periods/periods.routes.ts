import { Router } from 'express';
import { verifyToken, adminOnly } from '../../../shared/middlewares/auth';
import { validateParams } from '../../../shared/middlewares/validate';
import { IdParamSchema } from '../../../shared/schemas/common';
import * as ctrl from './periods.controller';

const router = Router();
router.use(verifyToken, adminOnly);

router.get('/', ctrl.list);
router.patch('/:id/toggle', validateParams(IdParamSchema), ctrl.toggle);

export default router;
