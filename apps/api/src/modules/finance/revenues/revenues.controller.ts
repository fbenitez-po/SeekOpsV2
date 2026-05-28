import type { Request, Response, NextFunction } from 'express';
import * as service from './revenues.service';
import type { ImportRevenueRow, ListRevenuesQuery } from './revenues.schema';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.list(req.query as unknown as ListRevenuesQuery));
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(201).json(await service.create(req.body, req.user?.email ?? null));
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.update(req.params['id'] as string, req.body, req.user?.email ?? null));
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.remove(req.params['id'] as string));
  } catch (err) {
    next(err);
  }
}

export async function importBatch(req: Request, res: Response, next: NextFunction) {
  try {
    const filas = req.body as ImportRevenueRow[];
    res.json(await service.importBatch(filas, req.user?.email ?? null));
  } catch (err) {
    next(err);
  }
}
