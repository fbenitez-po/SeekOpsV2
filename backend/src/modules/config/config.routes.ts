import { Router } from 'express';
import { verifyToken } from '../../shared/middlewares/auth';
import * as ctrl from './config.controller';

const router = Router();
router.use(verifyToken);

router.get('/equipos', ctrl.teams);
router.get('/areas', ctrl.areas);
router.get('/grupos', ctrl.profiles);
router.get('/segmentaciones', ctrl.clientSegmentations);
router.get('/sectores', ctrl.clientSectors);
router.get('/segmentaciones-proyecto', ctrl.projectSegmentations);
router.get('/categorias-proyecto', ctrl.projectCategories);
router.get('/capas-productividad', ctrl.productivityLayers);
router.get('/tipos-servicio', ctrl.serviceTypes);
router.get('/work-categories', ctrl.workCategories);

export default router;
