import type { Request, Response, NextFunction } from 'express';
import * as service from './periods.service';

export async function list(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.listUpToCurrent());
  } catch (err) {
    next(err);
  }
}

export async function toggle(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.toggle(req.params['id'] as string));
  } catch (err) {
    next(err);
  }
}
