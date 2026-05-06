import {NextFunction, Request, Response} from "express";
import {Prisma} from "@prisma/client";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error(err);

  // Prisma unique constraint violation
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      res.status(409).json({ error: "El registro ya existe (valor duplicado)" });
      return;
    }
    if (err.code === "P2003") {
      res.status(400).json({ error: "Referencia inválida: el recurso relacionado no existe" });
      return;
    }
    if (err.code === "P2025") {
      res.status(404).json({ error: "Registro no encontrado" });
      return;
    }
  }

  if (err instanceof ErrorApp) {
    res.status(err.status).json({ error: err.message });
    return;
  }

  res.status(500).json({ error: "internal server error" });
}

export class ErrorApp extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
    this.name = "ErrorApp";
  }
}
