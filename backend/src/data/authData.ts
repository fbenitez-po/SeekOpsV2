import {prisma} from "../lib/prisma";

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      isActive: true,
    },
  });
}

export async function findUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      isActive: true,
    },
  });
}

export async function getUserRoles(userId: string): Promise<string[]> {
  const memberships = await prisma.userGroupMember.findMany({
    where: { userId, group: { isActive: true } },
    select: { group: { select: { code: true } } },
  });
  return memberships.map((m) => m.group.code);
}

export async function getUserProjects(userId: string) {
  return prisma.projectUser.findMany({
    where: { userId, project: { isActive: true } },
    select: {
      role: true,
      project: { select: { id: true, name: true } },
    },
  });
}

export async function saveRefreshToken(
  userId: string,
  token: string,
  expiresAt: Date
) {
  await prisma.refreshToken.upsert({
    where: { userId },
    update: { token, expiresAt },
    create: { userId, token, expiresAt },
  });
}

export async function findRefreshToken(token: string) {
  return prisma.refreshToken.findFirst({
    where: { token },
    select: { userId: true, expiresAt: true },
  });
}

export async function deleteRefreshToken(token: string) {
  await prisma.refreshToken.deleteMany({ where: { token } });
}

export async function savePasswordResetToken(
  userId: string,
  token: string,
  expiresAt: Date
) {
  await prisma.passwordResetToken.upsert({
    where: { userId },
    update: { token, expiresAt },
    create: { userId, token, expiresAt },
  });
}

export async function findPasswordResetToken(token: string) {
  return prisma.passwordResetToken.findFirst({
    where: { token },
    select: { userId: true, expiresAt: true },
  });
}

export async function updatePassword(userId: string, passwordHash: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash, updatedAt: new Date() },
  });
}

export async function deletePasswordResetToken(token: string) {
  await prisma.passwordResetToken.deleteMany({ where: { token } });
}
