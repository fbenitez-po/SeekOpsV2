import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import {
  AppError,
  ForbiddenError,
  UnauthorizedError,
  ValidationError,
} from '../../shared/http/errorHandler';
import { env } from '../../shared/config/env';
import { logger } from '../../shared/logging/logger';
import * as repo from './auth.repository';
import { sendPasswordReset } from '../../shared/services/email.service';

function generateAccessToken(payload: object): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'] });
}

function generateRefreshToken(payload: object): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn'] });
}

export async function login(email: string, password: string) {
  const user = await repo.findUserByEmail(email);
  if (!user) {
    logger.warn({ email }, 'login failed: user not found');
    throw new UnauthorizedError('Credenciales inválidas');
  }
  if (!user.activo) {
    logger.warn({ email, usuario_id: user.id }, 'login failed: user inactive');
    throw new ForbiddenError('Usuario inactivo. Contactá al administrador.');
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    logger.warn({ email, usuario_id: user.id }, 'login failed: invalid password');
    throw new UnauthorizedError('Credenciales inválidas');
  }

  const roles = await repo.getUserRoles(user.id);
  const proyectos = await repo.getUserProjects(user.id);

  const payload = { usuario_id: user.id, email: user.email, roles, proyectos_ids: proyectos.map((p) => p.id) };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken({ usuario_id: user.id });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  await repo.saveRefreshToken(user.id, refreshToken, expiresAt);

  logger.info({ usuario_id: user.id, email: user.email }, 'login succeeded');

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in: 3600,
    usuario: {
      id: user.id,
      email: user.email,
      nombres: user.nombres,
      apellidos: user.apellidos,
      avatar_url: user.avatar_url,
      roles,
      proyectos: proyectos.map((p) => ({ id: p.id, nombre: p.nombre, rol: p.rol })),
    },
  };
}

export async function logout(refreshToken: string): Promise<void> {
  await repo.deleteRefreshToken(refreshToken);
}

export async function refreshAccessToken(refreshToken: string) {
  let payload: { usuario_id: string };
  try {
    payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { usuario_id: string };
  } catch {
    logger.warn('token refresh failed: invalid or expired token');
    throw new UnauthorizedError('Refresh token inválido o expirado');
  }

  const stored = await repo.findRefreshToken(refreshToken);
  if (!stored) throw new UnauthorizedError('Refresh token inválido o expirado');
  if (new Date(stored.expires_at) < new Date()) {
    await repo.deleteRefreshToken(refreshToken);
    throw new UnauthorizedError('Refresh token inválido o expirado');
  }

  const user = await repo.findUserById(payload.usuario_id);
  if (!user) throw new UnauthorizedError('Refresh token inválido o expirado');

  const roles = await repo.getUserRoles(payload.usuario_id);
  const proyectos = await repo.getUserProjects(payload.usuario_id);

  const newToken = generateAccessToken({
    usuario_id: user.id,
    email: user.email,
    roles,
    proyectos_ids: proyectos.map((p) => p.id),
  });

  logger.info({ usuario_id: user.id }, 'access token refreshed');

  return { access_token: newToken, expires_in: 3600 };
}

export async function requestPasswordReset(email: string): Promise<void> {
  const user = await repo.findUserByEmail(email);
  if (!user) {
    // Response is intentionally identical whether or not the user exists (no enumeration).
    logger.info({ email, found: false }, 'password reset requested');
    return;
  }

  const token = uuidv4();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  await repo.savePasswordResetToken(user.id, token, expiresAt);
  await sendPasswordReset(email, user.nombres, token);
  logger.info({ email, usuario_id: user.id, found: true }, 'password reset requested');
}

export async function confirmPasswordReset(token: string, newPassword: string, confirmPassword: string): Promise<void> {
  if (newPassword !== confirmPassword) throw new ValidationError('Las contraseñas no coinciden');

  const record = await repo.findPasswordResetToken(token);
  if (!record || new Date(record.expires_at) < new Date()) {
    logger.warn('password reset failed: invalid or expired token');
    throw new AppError('El link de recuperación expiró o es inválido', 410);
  }

  const hash = await bcrypt.hash(newPassword, 10);
  await repo.updatePassword(record.user_id, hash);
  await repo.deletePasswordResetToken(token);
  // Same endpoint also handles account activation (welcome token).
  logger.info({ usuario_id: record.user_id }, 'password reset confirmed');
}
