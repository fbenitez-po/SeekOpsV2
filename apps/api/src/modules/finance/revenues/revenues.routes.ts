import { Router } from 'express';
import { verifyToken, adminOnly } from '../../../shared/middlewares/auth';
import { validateBody, validateParams, validateQuery } from '../../../shared/middlewares/validate';
import { IdParamSchema } from '../../../shared/schemas/common';
import {
  CreateRevenueSchema,
  ImportRevenuesBodySchema,
  ListRevenuesQuerySchema,
  UpdateRevenueSchema,
} from './revenues.schema';
import * as ctrl from './revenues.controller';

const router = Router();
router.use(verifyToken, adminOnly);

router.get('/', validateQuery(ListRevenuesQuerySchema), ctrl.list);
router.post('/import', validateBody(ImportRevenuesBodySchema), ctrl.importBatch);
router.post('/', validateBody(CreateRevenueSchema), ctrl.create);
router.put('/:id', validateParams(IdParamSchema), validateBody(UpdateRevenueSchema), ctrl.update);
router.delete('/:id', validateParams(IdParamSchema), ctrl.remove);

export default router;
