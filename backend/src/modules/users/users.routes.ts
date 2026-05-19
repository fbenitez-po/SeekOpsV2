import { Router } from 'express';
import { verifyToken, adminOnly } from '../../shared/middlewares/auth';
import { validateBody } from '../../shared/middlewares/validate';
import { CreateUserSchema, UpdateUserSchema } from './users.schema';
import * as ctrl from './users.controller';

const router = Router();

router.use(verifyToken, adminOnly);

router.get('/', ctrl.list);
router.post('/', validateBody(CreateUserSchema), ctrl.create);
router.get('/:id', ctrl.getById);
router.put('/:id', validateBody(UpdateUserSchema), ctrl.update);
router.patch('/:id/toggle-activo', ctrl.toggleActive);

export default router;
