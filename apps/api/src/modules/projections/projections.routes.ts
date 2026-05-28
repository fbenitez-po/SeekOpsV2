import { Router } from 'express';
import { verifyToken, managerOrAdmin } from '../../shared/middlewares/auth';
import { validateBody } from '../../shared/middlewares/validate';
import { CreateProjectionSchema, UpdateProjectionSchema } from './projections.schema';
import * as ctrl from './projections.controller';

const router = Router();

router.use(verifyToken);
router.use(managerOrAdmin);

router.get('/alerts', ctrl.listAlerts);
router.get('/', ctrl.list);
router.post('/', validateBody(CreateProjectionSchema), ctrl.create);
router.put('/:id', validateBody(UpdateProjectionSchema), ctrl.update);
router.delete('/:id', ctrl.remove);

export default router;
