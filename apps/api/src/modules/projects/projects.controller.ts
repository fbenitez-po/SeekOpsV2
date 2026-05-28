import { Request, Response, NextFunction } from 'express';
import * as service from './projects.service';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.usuario_id;
    const roles = req.user!.roles;
    res.json(await service.list(req.query as Record<string, string>, userId, roles));
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.usuario_id;
    const roles = req.user!.roles;
    res.json(await service.getById(req.params['id'] as string, userId, roles));
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

export async function toggleActive(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.toggleActive(req.params['id'] as string, req.user?.email ?? null));
  } catch (err) {
    next(err);
  }
}

export async function assignUsers(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.assignUsers(req.params['id'] as string, req.body.usuarios));
  } catch (err) {
    next(err);
  }
}

export async function removeUser(req: Request, res: Response, next: NextFunction) {
  try {
    await service.removeUser(req.params['id'] as string, req.params['usuario_id'] as string);
    res.json({ message: 'Usuario desasignado correctamente' });
  } catch (err) {
    next(err);
  }
}
