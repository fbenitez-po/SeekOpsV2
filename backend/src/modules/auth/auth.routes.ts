import { Router } from 'express';
import { verifyToken } from '../../shared/middlewares/auth';
import { validateBody } from '../../shared/middlewares/validate';
import {
  ConfirmarResetSchema,
  LoginSchema,
  LogoutSchema,
  RefreshSchema,
  SolicitarResetSchema,
} from './auth.schema';
import * as ctrl from './auth.controller';

const router = Router();

router.post('/login', validateBody(LoginSchema), ctrl.login);
router.post('/logout', verifyToken, validateBody(LogoutSchema), ctrl.logout);
router.post('/refresh-token', validateBody(RefreshSchema), ctrl.refresh);
router.post('/solicitar-reset', validateBody(SolicitarResetSchema), ctrl.solicitarReset);
router.post('/confirmar-reset', validateBody(ConfirmarResetSchema), ctrl.confirmarReset);

export default router;
