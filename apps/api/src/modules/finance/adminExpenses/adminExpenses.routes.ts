import { Router } from 'express';
import { verifyToken, adminOnly } from '../../../shared/middlewares/auth';
import { validateBody, validateParams, validateQuery } from '../../../shared/middlewares/validate';
import { IdParamSchema } from '../../../shared/schemas/common';
import { AdminExpenseBodySchema, ListAdminExpensesQuerySchema } from './adminExpenses.schema';
import * as ctrl from './adminExpenses.controller';

const router = Router();
router.use(verifyToken, adminOnly);

router.get('/', validateQuery(ListAdminExpensesQuerySchema), ctrl.list);
router.post('/', validateBody(AdminExpenseBodySchema), ctrl.create);
router.get('/:id', validateParams(IdParamSchema), ctrl.getById);
router.put('/:id', validateParams(IdParamSchema), validateBody(AdminExpenseBodySchema), ctrl.update);
router.delete('/:id', validateParams(IdParamSchema), ctrl.remove);

export default router;
