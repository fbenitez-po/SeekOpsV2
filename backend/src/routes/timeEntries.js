const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middlewares/validate');
const { verificarToken } = require('../middlewares/auth');
const service = require('../services/timeEntryService');

router.use(verificarToken);

router.get('/', async (req, res, next) => {
  try {
    const { usuario_id, roles, proyectos_ids } = req.usuario;
    const resultado = await service.listar(usuario_id, roles, proyectos_ids, req.query);
    res.json(resultado);
  } catch (err) {
    next(err);
  }
});

router.post(
  '/',
  [
    body('semana').matches(/^S\d{2}\/\d{2}$/).withMessage('semana debe tener formato S15/26'),
    body('lineas').isArray({ min: 1 }).withMessage('lineas debe ser un array con al menos un elemento'),
    body('lineas.*.proyecto_id').isUUID().withMessage('proyecto_id inválido'),
    body('lineas.*.horas').isInt({ min: 0, max: 24 }).withMessage('horas debe ser entre 0 y 24'),
    body('lineas.*.horas_extra').optional().isInt({ min: 0, max: 8 }).withMessage('horas_extra debe ser entre 0 y 8'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { usuario_id, roles } = req.usuario;
      const resultado = await service.crear(usuario_id, roles, req.body);
      res.status(201).json(resultado);
    } catch (err) {
      next(err);
    }
  }
);

router.get('/:id', async (req, res, next) => {
  try {
    const { usuario_id, roles } = req.usuario;
    const resultado = await service.obtenerPorId(req.params.id, usuario_id, roles);
    res.json(resultado);
  } catch (err) {
    next(err);
  }
});

router.put(
  '/:id',
  [
    body('lineas').isArray({ min: 1 }).withMessage('lineas es requerido'),
    body('lineas.*.id').isUUID().withMessage('id de línea inválido'),
    body('lineas.*.horas').isInt({ min: 0, max: 24 }).withMessage('horas debe ser entre 0 y 24'),
    body('lineas.*.horas_extra').optional().isInt({ min: 0, max: 8 }).withMessage('horas_extra debe ser entre 0 y 8'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { usuario_id } = req.usuario;
      const resultado = await service.ajustar(req.params.id, usuario_id, req.body.lineas);
      res.json(resultado);
    } catch (err) {
      next(err);
    }
  }
);

router.post('/:id/aprobar', async (req, res, next) => {
  try {
    const { usuario_id, roles } = req.usuario;
    const resultado = await service.aprobar(req.params.id, usuario_id, roles);
    res.json(resultado);
  } catch (err) {
    next(err);
  }
});

router.post(
  '/:id/observar',
  [body('comentario_observacion').notEmpty().withMessage('comentario_observacion es requerido')],
  validate,
  async (req, res, next) => {
    try {
      const { usuario_id, roles } = req.usuario;
      const resultado = await service.observar(req.params.id, usuario_id, roles, req.body);
      res.json(resultado);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/:id/rechazar',
  [body('razon_rechazo').notEmpty().withMessage('razon_rechazo es requerida')],
  validate,
  async (req, res, next) => {
    try {
      const { usuario_id, roles } = req.usuario;
      const resultado = await service.rechazar(req.params.id, usuario_id, roles, req.body);
      res.json(resultado);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
