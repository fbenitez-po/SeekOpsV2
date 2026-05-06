import {NextFunction, Request, Response} from "express";
import jwt from "jsonwebtoken";
import type {JwtPayload} from "../types";

export function verificarToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ error: "Token requerido" });
    return;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: "Token inválido o expirado" });
  }
}

export function soloAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user?.roles?.includes("ADMIN")) {
    res.status(403).json({ error: "Solo administradores pueden realizar esta acción" });
    return;
  }
  next();
}

export function soloGestorOAdmin(req: Request, res: Response, next: NextFunction): void {
  const roles = req.user?.roles ?? [];
  if (!roles.includes("MANAGER") && !roles.includes("ADMIN")) {
    res.status(403).json({ error: "Solo gestores o administradores pueden realizar esta acción" });
    return;
  }
  next();
}
