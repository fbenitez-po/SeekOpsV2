import { Request, Response, NextFunction } from 'express';
import * as service from './users.service';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.list(req.query as Record<string, string>));
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
    res.status(201).json(await service.create(req.body));
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.update(req.params['id'] as string, req.body));
  } catch (err) {
    next(err);
  }
}

export async function toggleActive(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.toggleActive(req.params['id'] as string, req.user?.email ?? null));
  } catch (err) {
    next(err);
  }
}
