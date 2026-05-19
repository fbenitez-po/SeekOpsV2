import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

export function verifyToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Token requerido' });
    return;
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as Express.Request['user'];
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

export function adminOnly(req: Request, res: Response, next: NextFunction): void {
  if (!req.user?.roles?.includes('ADMIN')) {
    res.status(403).json({ error: 'Solo administradores pueden realizar esta acción' });
    return;
  }
  next();
}

export function managerOrAdmin(req: Request, res: Response, next: NextFunction): void {
  const roles = req.user?.roles ?? [];
  if (!roles.includes('GESTOR') && !roles.includes('ADMIN')) {
    res.status(403).json({ error: 'Solo gestores o administradores pueden realizar esta acción' });
    return;
  }
  next();
}
