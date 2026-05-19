import { Router } from 'express';
import { verifyToken, adminOnly } from '../../shared/middlewares/auth';
import { validateBody } from '../../shared/middlewares/validate';
import { CreateProjectSchema, AssignUsersSchema } from './projects.schema';
import * as ctrl from './projects.controller';

const router = Router();

router.use(verifyToken);

router.get('/', ctrl.list);
router.post('/', adminOnly, validateBody(CreateProjectSchema), ctrl.create);
router.get('/:id', ctrl.getById);
router.put('/:id', adminOnly, ctrl.update);
router.patch('/:id/toggle-activo', adminOnly, ctrl.toggleActive);
router.post('/:id/usuarios', adminOnly, validateBody(AssignUsersSchema), ctrl.assignUsers);
router.delete('/:id/usuarios/:usuario_id', adminOnly, ctrl.removeUser);

export default router;
