import type { Request, Response, NextFunction } from 'express';
import * as service from './auth.service';
import type {
  ConfirmarResetInput,
  LoginInput,
  LogoutInput,
  RefreshInput,
  SolicitarResetInput,
} from './auth.schema';

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body as LoginInput;
    const result = await service.login(email, password);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const { refresh_token } = req.body as LogoutInput;
    if (refresh_token) await service.logout(refresh_token);
    res.json({ message: 'Sesión cerrada correctamente' });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const { refresh_token } = req.body as RefreshInput;
    const result = await service.refreshAccessToken(refresh_token);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function solicitarReset(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = req.body as SolicitarResetInput;
    await service.requestPasswordReset(email);
    res.json({ message: 'Si el email existe, recibirás instrucciones en breve.' });
  } catch (err) {
    next(err);
  }
}

export async function confirmarReset(req: Request, res: Response, next: NextFunction) {
  try {
    const { token, nueva_password, confirmar_password } = req.body as ConfirmarResetInput;
    await service.confirmPasswordReset(token, nueva_password, confirmar_password);
    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (err) {
    next(err);
  }
}
