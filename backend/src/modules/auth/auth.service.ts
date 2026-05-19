import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../../shared/http/errorHandler';
import { env } from '../../shared/config/env';
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
  if (!user) throw new AppError('Credenciales inválidas', 401);
  if (!user.activo) throw new AppError('Usuario inactivo. Contactá al administrador.', 403);

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw new AppError('Credenciales inválidas', 401);

  const roles = await repo.getUserRoles(user.id);
  const proyectos = await repo.getUserProjects(user.id);

  const payload = { usuario_id: user.id, email: user.email, roles, proyectos_ids: proyectos.map((p) => p.id) };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken({ usuario_id: user.id });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  await repo.saveRefreshToken(user.id, refreshToken, expiresAt);

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
    throw new AppError('Refresh token inválido o expirado', 401);
  }

  const stored = await repo.findRefreshToken(refreshToken);
  if (!stored) throw new AppError('Refresh token inválido o expirado', 401);
  if (new Date(stored.expires_at) < new Date()) {
    await repo.deleteRefreshToken(refreshToken);
    throw new AppError('Refresh token inválido o expirado', 401);
  }

  const user = await repo.findUserById(payload.usuario_id);
  if (!user) throw new AppError('Refresh token inválido o expirado', 401);

  const roles = await repo.getUserRoles(payload.usuario_id);
  const proyectos = await repo.getUserProjects(payload.usuario_id);

  const newToken = generateAccessToken({
    usuario_id: user.id,
    email: user.email,
    roles,
    proyectos_ids: proyectos.map((p) => p.id),
  });

  return { access_token: newToken, expires_in: 3600 };
}

export async function requestPasswordReset(email: string): Promise<void> {
  const user = await repo.findUserByEmail(email);
  if (!user) return;

  const token = uuidv4();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  await repo.savePasswordResetToken(user.id, token, expiresAt);
  await sendPasswordReset(email, user.nombres, token);
}

export async function confirmPasswordReset(token: string, newPassword: string, confirmPassword: string): Promise<void> {
  if (newPassword !== confirmPassword) throw new AppError('Las contraseñas no coinciden', 400);

  const record = await repo.findPasswordResetToken(token);
  if (!record || new Date(record.expires_at) < new Date()) {
    throw new AppError('El link de recuperación expiró o es inválido', 410);
  }

  const hash = await bcrypt.hash(newPassword, 10);
  await repo.updatePassword(record.user_id, hash);
  await repo.deletePasswordResetToken(token);
}
