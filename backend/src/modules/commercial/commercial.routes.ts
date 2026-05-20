import { Router } from 'express';
import { verifyToken, adminOnly } from '../../shared/middlewares/auth';
import { validateBody, validateParams, validateQuery } from '../../shared/middlewares/validate';
import { IdParamSchema } from '../../shared/schemas/common';
import { CommercialBodySchema, ListCommercialQuerySchema } from './commercial.schema';
import * as ctrl from './commercial.controller';

const router = Router();
router.use(verifyToken, adminOnly);

router.get('/document-types', ctrl.documentTypes);
router.get('/', validateQuery(ListCommercialQuerySchema), ctrl.list);
router.get('/:id', validateParams(IdParamSchema), ctrl.getById);
router.post('/', validateBody(CommercialBodySchema), ctrl.create);
router.put('/:id', validateParams(IdParamSchema), validateBody(CommercialBodySchema), ctrl.update);
router.delete('/:id', validateParams(IdParamSchema), ctrl.remove);

export default router;
