import { Request, Response, NextFunction } from 'express';
import * as service from './projections.service';

export async function listAlerts(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.listAlerts(req.user!.usuario_id, req.user!.roles));
  } catch (err) {
    next(err);
  }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.list(req.query as Record<string, string>, req.user!.usuario_id, req.user!.roles));
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    res
      .status(201)
      .json(await service.create(req.body, req.user!.usuario_id, req.user?.email ?? null, req.user!.roles));
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(
      await service.update(
        req.params['id'] as string,
        req.body,
        req.user!.usuario_id,
        req.user?.email ?? null,
        req.user!.roles,
      ),
    );
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.remove(req.params['id'] as string, req.user!.usuario_id, req.user!.roles));
  } catch (err) {
    next(err);
  }
}
