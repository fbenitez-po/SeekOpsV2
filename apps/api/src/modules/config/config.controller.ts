import type { Request, Response, NextFunction } from 'express';
import * as service from './config.service';

function handler(fn: () => Promise<unknown>) {
  return async (_req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await fn());
    } catch (err) {
      next(err);
    }
  };
}

export const teams = handler(service.teams);
export const areas = handler(service.areas);
export const profiles = handler(service.profiles);
export const clientSegmentations = handler(service.clientSegmentations);
export const clientSectors = handler(service.clientSectors);
export const projectSegmentations = handler(service.projectSegmentations);
export const projectCategories = handler(service.projectCategories);
export const productivityLayers = handler(service.productivityLayers);
export const serviceTypes = handler(service.serviceTypes);
export const workCategories = handler(service.workCategories);
