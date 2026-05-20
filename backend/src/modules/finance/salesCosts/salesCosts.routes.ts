import { Router } from 'express';
import { verifyToken, adminOnly } from '../../../shared/middlewares/auth';
import { validateBody, validateParams, validateQuery } from '../../../shared/middlewares/validate';
import { IdParamSchema } from '../../../shared/schemas/common';
import { SalesCostBodySchema, ListSalesCostsQuerySchema } from './salesCosts.schema';
import * as ctrl from './salesCosts.controller';

const router = Router();
router.use(verifyToken, adminOnly);

router.get('/', validateQuery(ListSalesCostsQuerySchema), ctrl.list);
router.post('/', validateBody(SalesCostBodySchema), ctrl.create);
router.get('/:id', validateParams(IdParamSchema), ctrl.getById);
router.put('/:id', validateParams(IdParamSchema), validateBody(SalesCostBodySchema), ctrl.update);
router.delete('/:id', validateParams(IdParamSchema), ctrl.remove);

export default router;
