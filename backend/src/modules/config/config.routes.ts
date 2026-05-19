import { Router } from 'express';
import { verifyToken } from '../../shared/middlewares/auth';
import { asyncHandler } from '../../shared/http/asyncHandler';
import * as repo from './config.repository';

const router = Router();

router.use(verifyToken);

router.get('/equipos', asyncHandler(async (_req, res) => { res.json(await repo.getTeams()); }));
router.get('/areas', asyncHandler(async (_req, res) => { res.json(await repo.getAreas()); }));
router.get('/grupos', asyncHandler(async (_req, res) => { res.json(await repo.getProfiles()); }));
router.get('/categorias-ingreso', asyncHandler(async (_req, res) => { res.json(await repo.getIncomeCategories()); }));
router.get('/segmentaciones', asyncHandler(async (_req, res) => { res.json(await repo.getClientSegmentations()); }));
router.get('/sectores', asyncHandler(async (_req, res) => { res.json(await repo.getClientSectors()); }));
router.get('/segmentaciones-proyecto', asyncHandler(async (_req, res) => { res.json(await repo.getProjectSegmentations()); }));
router.get('/categorias-proyecto', asyncHandler(async (_req, res) => { res.json(await repo.getProjectCategories()); }));
router.get('/capas-productividad', asyncHandler(async (_req, res) => { res.json(await repo.getProductivityLayers()); }));
router.get('/tipos-servicio', asyncHandler(async (_req, res) => { res.json(await repo.getServiceTypes()); }));
router.get('/work-categories', asyncHandler(async (_req, res) => { res.json(await repo.getWorkCategories()); }));

export default router;
