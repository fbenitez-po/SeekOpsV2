import { Router } from 'express';
import { verifyToken } from '../../shared/middlewares/auth';
import { validateBody } from '../../shared/middlewares/validate';
import {
  CreateTimeEntrySchema,
  AdjustTimeEntrySchema,
  ApproveWithObservationSchema,
  RejectSchema,
} from './timeEntries.schema';
import * as ctrl from './timeEntries.controller';

const router = Router();

router.use(verifyToken);

// Sub-resource routes before /:id to prevent param capture
router.get('/semanas-sin-carga', ctrl.getMissingWeeks);
router.get('/seekers-sin-carga', ctrl.getSeekersWithMissingLoad);
router.post('/seekers-sin-carga/:userId/recordatorio', ctrl.sendReminder);

router.get('/', ctrl.list);
router.post('/', validateBody(CreateTimeEntrySchema), ctrl.create);
router.get('/:id', ctrl.getById);
router.put('/:id', validateBody(AdjustTimeEntrySchema), ctrl.adjust);

// Approval actions (renamed from Spanish verbs)
router.post('/:id/approve', ctrl.approve);
router.post('/:id/observe', validateBody(ApproveWithObservationSchema), ctrl.observe);
router.post('/:id/reject', validateBody(RejectSchema), ctrl.reject);

export default router;
