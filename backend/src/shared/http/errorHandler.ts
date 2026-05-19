import type { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export function errorHandler(err: AppError & { code?: string }, _req: Request, res: Response, _next: NextFunction): void {
  console.error(err);

  if (err.code === '23505') {
    res.status(409).json({ error: 'El registro ya existe (valor duplicado)' });
    return;
  }

  if (err.code === '23503') {
    res.status(400).json({ error: 'Referencia inválida: el recurso relacionado no existe' });
    return;
  }

  const status = err.status || 500;
  const message = status < 500 ? err.message : 'internal server error';
  res.status(status).json({ error: message });
}
