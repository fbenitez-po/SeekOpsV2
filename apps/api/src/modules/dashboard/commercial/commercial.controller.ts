import { Request, Response, NextFunction } from 'express';
import * as service from './commercial.service';

export async function list(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.list());
  } catch (err) {
    next(err);
  }
}
