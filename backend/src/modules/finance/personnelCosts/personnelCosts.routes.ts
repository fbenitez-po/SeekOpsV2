import { Router } from 'express';
import { verifyToken, adminOnly } from '../../../shared/middlewares/auth';
import { validateBody, validateParams, validateQuery } from '../../../shared/middlewares/validate';
import { IdParamSchema } from '../../../shared/schemas/common';
import {
  ImportPersonnelCostsBodySchema,
  ListPersonnelCostsQuerySchema,
  PersonnelCostBodySchema,
} from './personnelCosts.schema';
import * as ctrl from './personnelCosts.controller';

const router = Router();
router.use(verifyToken, adminOnly);

router.get('/', validateQuery(ListPersonnelCostsQuerySchema), ctrl.list);
router.post('/import', validateBody(ImportPersonnelCostsBodySchema), ctrl.importBatch);
router.post('/', validateBody(PersonnelCostBodySchema), ctrl.create);
router.get('/:id', validateParams(IdParamSchema), ctrl.getById);
router.put('/:id', validateParams(IdParamSchema), validateBody(PersonnelCostBodySchema), ctrl.update);
router.delete('/:id', validateParams(IdParamSchema), ctrl.remove);

export default router;
