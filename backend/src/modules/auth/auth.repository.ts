import { prisma } from '../../shared/db/prisma';

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  nombres: string;
  apellidos: string;
  avatar_url: string | null;
  activo: boolean;
}

export interface ProjectRow {
  id: string;
  nombre: string;
  rol: string;
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const u = await prisma.users.findUnique({
    where: { email },
    select: { id: true, email: true, password_hash: true, first_name: true, last_name: true, avatar_url: true, is_active: true },
  });
  if (!u) return null;
  return { id: u.id, email: u.email, password_hash: u.password_hash, nombres: u.first_name, apellidos: u.last_name, avatar_url: u.avatar_url, activo: u.is_active };
}

export async function findUserById(id: string): Promise<UserRow | null> {
  const u = await prisma.users.findUnique({
    where: { id },
    select: { id: true, email: true, password_hash: true, first_name: true, last_name: true, avatar_url: true, is_active: true },
  });
  if (!u) return null;
  return { id: u.id, email: u.email, password_hash: u.password_hash, nombres: u.first_name, apellidos: u.last_name, avatar_url: u.avatar_url, activo: u.is_active };
}

export async function getUserRoles(userId: string): Promise<string[]> {
  const rows = await prisma.user_profile.findMany({
    where: { user_id: userId, profiles: { is_active: true } },
    select: { profiles: { select: { code: true } } },
  });
  return rows.map((r) => r.profiles.code);
}

export async function getUserProjects(userId: string): Promise<ProjectRow[]> {
  const rows = await prisma.project_user.findMany({
    where: { user_id: userId, projects: { is_active: true } },
    select: { projects: { select: { id: true, name: true } }, role: true },
  });
  return rows.map((r) => ({ id: r.projects.id, nombre: r.projects.name, rol: r.role }));
}

export async function saveRefreshToken(userId: string, token: string, expiresAt: Date): Promise<void> {
  await prisma.refresh_tokens.upsert({
    where: { user_id: userId },
    update: { token, expires_at: expiresAt },
    create: { user_id: userId, token, expires_at: expiresAt },
  });
}

export async function findRefreshToken(token: string): Promise<{ user_id: string; expires_at: Date } | null> {
  return prisma.refresh_tokens.findFirst({ where: { token }, select: { user_id: true, expires_at: true } });
}

export async function deleteRefreshToken(token: string): Promise<void> {
  await prisma.refresh_tokens.deleteMany({ where: { token } });
}

export async function savePasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<void> {
  await prisma.password_reset_tokens.upsert({
    where: { user_id: userId },
    update: { token, expires_at: expiresAt },
    create: { user_id: userId, token, expires_at: expiresAt },
  });
}

export async function findPasswordResetToken(token: string): Promise<{ user_id: string; expires_at: Date } | null> {
  return prisma.password_reset_tokens.findFirst({ where: { token }, select: { user_id: true, expires_at: true } });
}

export async function updatePassword(userId: string, passwordHash: string): Promise<void> {
  await prisma.users.update({ where: { id: userId }, data: { password_hash: passwordHash, updated_at: new Date() } });
}

export async function deletePasswordResetToken(token: string): Promise<void> {
  await prisma.password_reset_tokens.deleteMany({ where: { token } });
}
