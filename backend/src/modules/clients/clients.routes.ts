import { Router } from 'express';
import { verifyToken, adminOnly } from '../../shared/middlewares/auth';
import { validateBody } from '../../shared/middlewares/validate';
import { CreateClientSchema, UpdateClientSchema } from './clients.schema';
import * as ctrl from './clients.controller';

const router = Router();

router.use(verifyToken, adminOnly);

router.get('/', ctrl.list);
router.post('/', validateBody(CreateClientSchema), ctrl.create);
router.get('/:id', ctrl.getById);
router.put('/:id', validateBody(UpdateClientSchema), ctrl.update);
router.patch('/:id/toggle-activo', ctrl.toggleActive);

export default router;
