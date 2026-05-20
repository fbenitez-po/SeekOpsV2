import type { Request, Response, NextFunction } from 'express';

export interface ValidationDetail {
  field: string;
  message: string;
}

export class AppError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends AppError {
  details?: ValidationDetail[];
  constructor(message: string, details?: ValidationDetail[]) {
    super(message, 400);
    this.details = details;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'No autorizado') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Acceso denegado') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Recurso no encontrado') {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}

export function notFoundHandler(_req: Request, _res: Response, next: NextFunction): void {
  next(new NotFoundError('Recurso no encontrado'));
}

export function errorHandler(
  err: AppError & { code?: string; details?: ValidationDetail[] },
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err.code === '23505') {
    res.status(409).json({ error: 'El registro ya existe (valor duplicado)' });
    return;
  }

  if (err.code === '23503') {
    res.status(400).json({ error: 'Referencia inválida: el recurso relacionado no existe' });
    return;
  }

  const isAppError = err instanceof AppError;
  const status = isAppError ? err.status : 500;

  if (!isAppError || status >= 500) {
    console.error(err);
  }

  const message = status < 500 ? err.message : 'internal server error';
  const body: { error: string; details?: ValidationDetail[] } = { error: message };
  if (err instanceof ValidationError && err.details && err.details.length > 0) {
    body.details = err.details;
  }
  res.status(status).json(body);
}
