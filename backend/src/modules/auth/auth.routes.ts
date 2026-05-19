import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../shared/http/asyncHandler';
import { verifyToken } from '../../shared/middlewares/auth';
import * as service from './auth.service';

const router = Router();

const LoginSchema = z.object({
  email: z.string().email('El email ingresado no es válido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

const RefreshSchema = z.object({
  refresh_token: z.string().min(1, 'El token de sesión es requerido'),
});

const SolicitarResetSchema = z.object({
  email: z.string().email('El email ingresado no es válido'),
});

const ConfirmarResetSchema = z.object({
  token: z.string().min(1, 'El token de recuperación es requerido'),
  nueva_password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  confirmar_password: z.string().min(1, 'La confirmación de contraseña es requerida'),
});

function validate<T>(schema: z.ZodSchema<T>, data: unknown, res: import('express').Response): T | null {
  const result = schema.safeParse(data);
  if (!result.success) {
    res.status(400).json({ error: result.error.issues[0]?.message ?? 'Datos inválidos' });
    return null;
  }
  return result.data;
}

router.post('/login', asyncHandler(async (req, res) => {
  const body = validate(LoginSchema, req.body, res);
  if (!body) return;
  const result = await service.login(body.email, body.password);
  res.status(201).json(result);
}));

router.post('/logout', verifyToken, asyncHandler(async (req, res) => {
  const { refresh_token } = req.body as { refresh_token?: string };
  if (refresh_token) await service.logout(refresh_token);
  res.json({ message: 'Sesión cerrada correctamente' });
}));

router.post('/refresh-token', asyncHandler(async (req, res) => {
  const body = validate(RefreshSchema, req.body, res);
  if (!body) return;
  const result = await service.refreshAccessToken(body.refresh_token);
  res.json(result);
}));

router.post('/solicitar-reset', asyncHandler(async (req, res) => {
  const body = validate(SolicitarResetSchema, req.body, res);
  if (!body) return;
  await service.requestPasswordReset(body.email);
  res.json({ message: 'Si el email existe, recibirás instrucciones en breve.' });
}));

router.post('/confirmar-reset', asyncHandler(async (req, res) => {
  const body = validate(ConfirmarResetSchema, req.body, res);
  if (!body) return;
  await service.confirmPasswordReset(body.token, body.nueva_password, body.confirmar_password);
  res.json({ message: 'Contraseña actualizada correctamente' });
}));

export default router;
