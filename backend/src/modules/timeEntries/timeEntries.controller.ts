import { Request, Response, NextFunction } from 'express';
import * as service from './timeEntries.service';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(
      await service.list(req.query as Record<string, string>, req.user!.usuario_id, req.user!.roles),
    );
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.getById(req.params['id'] as string, req.user!.usuario_id, req.user!.roles));
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

export async function adjust(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(
      await service.adjust(req.params['id'] as string, req.body, req.user!.usuario_id, req.user?.email ?? null),
    );
  } catch (err) {
    next(err);
  }
}

export async function approve(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(
      await service.approve(
        req.params['id'] as string,
        req.user!.usuario_id,
        req.user?.email ?? null,
        req.user!.roles,
      ),
    );
  } catch (err) {
    next(err);
  }
}

export async function observe(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(
      await service.observe(
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

export async function reject(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(
      await service.reject(
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

export async function getMissingWeeks(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.getMissingWeeks(req.user!.usuario_id));
  } catch (err) {
    next(err);
  }
}

export async function getSeekersWithMissingLoad(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await service.getSeekersWithMissingLoad(req.user!.usuario_id, req.user!.roles));
  } catch (err) {
    next(err);
  }
}

export async function sendReminder(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(
      await service.sendReminder(req.user!.usuario_id, req.params['userId'] as string, req.user!.roles),
    );
  } catch (err) {
    next(err);
  }
}
