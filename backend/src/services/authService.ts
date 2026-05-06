import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {v4 as uuidv4} from "uuid";
import {ErrorApp} from "../middlewares/errorHandler";
import * as authData from "../data/authData";
import * as emailService from "./emailService";

function generateAccessToken(payload: object): string {
  return jwt.sign(payload, process.env.JWT_SECRET as string, {
    expiresIn: (process.env.JWT_EXPIRES_IN ?? "1h") as jwt.SignOptions["expiresIn"],
  });
}

function generateRefreshToken(payload: object): string {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET as string, {
    expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN ?? "7d") as jwt.SignOptions["expiresIn"],
  });
}

export async function login(email: string, password: string) {
  const user = await authData.findUserByEmail(email);

  if (!user) throw new ErrorApp("Credenciales inválidas", 401);
  if (!user.isActive) throw new ErrorApp("Usuario inactivo. Contactá al administrador.", 403);

  const validPassword = await bcrypt.compare(password, user.passwordHash);
  if (!validPassword) throw new ErrorApp("Credenciales inválidas", 401);

  const roles = await authData.getUserRoles(user.id);
  const projects = await authData.getUserProjects(user.id);

  const payload = {
    userId: user.id,
    roles,
    projectIds: projects.map((p) => p.project.id),
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken({ userId: user.id });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  await authData.saveRefreshToken(user.id, refreshToken, expiresAt);

  return {
    accessToken,
    refreshToken,
    expiresIn: 3600,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      roles,
      projects: projects.map((p) => ({
        id: p.project.id,
        name: p.project.name,
        role: p.role,
      })),
    },
  };
}

export async function logout(refreshToken: string) {
  await authData.deleteRefreshToken(refreshToken);
}

export async function refreshAccessToken(refreshToken: string) {
  let payload: { userId: string };
  try {
    payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET as string) as { userId: string };
  } catch {
    throw new ErrorApp("Refresh token inválido o expirado", 401);
  }

  const stored = await authData.findRefreshToken(refreshToken);
  if (!stored) throw new ErrorApp("Refresh token inválido o expirado", 401);

  if (new Date(stored.expiresAt) < new Date()) {
    await authData.deleteRefreshToken(refreshToken);
    throw new ErrorApp("Refresh token inválido o expirado", 401);
  }

  const user = await authData.findUserById(payload.userId);
  const roles = await authData.getUserRoles(payload.userId);
  const projects = await authData.getUserProjects(payload.userId);

  const newToken = generateAccessToken({
    userId: user!.id,
    roles,
    projectIds: projects.map((p) => p.project.id),
  });

  return { accessToken: newToken, expiresIn: 3600 };
}

export async function requestPasswordReset(email: string) {
  const user = await authData.findUserByEmail(email);
  if (!user) return;

  const token = uuidv4();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  await authData.savePasswordResetToken(user.id, token, expiresAt);

  await emailService.enviarResetPassword(email, user.firstName, token);
}

export async function confirmPasswordReset(
  token: string,
  newPassword: string,
  confirmPassword: string
) {
  if (newPassword !== confirmPassword) {
    throw new ErrorApp("Las contraseñas no coinciden", 400);
  }

  const record = await authData.findPasswordResetToken(token);
  if (!record || new Date(record.expiresAt) < new Date()) {
    throw new ErrorApp("El link de recuperación expiró o es inválido", 410);
  }

  const hash = await bcrypt.hash(newPassword, 10);
  await authData.updatePassword(record.userId, hash);
  await authData.deletePasswordResetToken(token);
}
