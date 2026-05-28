import type { Request, Response, NextFunction } from 'express';
import * as service from './adminExpenses.service';
import type { ListAdminExpensesQuery } from './adminExpenses.schema';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.list(req.query as unknown as ListAdminExpensesQuery));
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.getById(req.params['id'] as string));
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
