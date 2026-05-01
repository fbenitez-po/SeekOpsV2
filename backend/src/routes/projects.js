const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middlewares/validate');
const { verificarToken, soloAdmin } = require('../middlewares/auth');
const service = require('../services/projectService');

router.use(verificarToken);

router.get('/', async (req, res, next) => {
  try {
    const { usuario_id, roles } = req.usuario;
    res.json(await service.listar(req.query, usuario_id, roles));
  } catch (err) {
    next(err);
  }
});

router.post(
  '/',
  soloAdmin,
  [
    body('codigo').matches(/^[a-zA-Z0-9-]{1,20}$/).withMessage('codigo inválido (alfanumérico + guiones, max 20)'),
    body('nombre').notEmpty().isLength({ max: 100 }).withMessage('nombre es requerido (max 100)'),
    body('cliente_id').isUUID().withMessage('cliente_id inválido'),
    body('gestor_id').isUUID().withMessage('gestor_id inválido'),
    body('segmentacion_id').isUUID().withMessage('segmentacion_id inválido'),
    body('categoria_proyecto_id').optional({ nullable: true, checkFalsy: true }).isUUID().withMessage('categoria_proyecto_id inválido'),
    body('area_id').optional({ nullable: true }).isUUID().withMessage('area_id inválido'),
    body('fecha_fin').optional({ nullable: true }).isDate().withMessage('fecha_fin inválida'),
    body('fecha_inicio').optional({ nullable: true }).isDate().withMessage('fecha_inicio inválida'),
  ],
  validate,
  async (req, res, next) => {
    try {
      res.status(201).json(await service.crear(req.body));
    } catch (err) {
      next(err);
    }
  }
);

router.get('/:id', async (req, res, next) => {
  try {
    const { usuario_id, roles } = req.usuario;
    res.json(await service.obtenerPorId(req.params.id, usuario_id, roles));
  } catch (err) {
    next(err);
  }
});

router.put('/:id', soloAdmin, async (req, res, next) => {
  try {
    res.json(await service.actualizar(req.params.id, req.body));
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/toggle-activo', soloAdmin, async (req, res, next) => {
  try {
    res.json(await service.toggleActivo(req.params.id));
  } catch (err) {
    next(err);
  }
});

router.post(
  '/:id/usuarios',
  soloAdmin,
  [
    body('usuarios').isArray({ min: 1 }).withMessage('usuarios debe ser un array no vacío'),
    body('usuarios.*.usuario_id').isUUID().withMessage('usuario_id inválido'),
    body('usuarios.*.rol').isIn(['SEEKER', 'GESTOR']).withMessage('rol debe ser SEEKER o GESTOR'),
  ],
  validate,
  async (req, res, next) => {
    try {
      res.json(await service.asignarUsuarios(req.params.id, req.body.usuarios));
    } catch (err) {
      next(err);
    }
  }
);

router.delete('/:id/usuarios/:usuario_id', soloAdmin, async (req, res, next) => {
  try {
    await service.desasignarUsuario(req.params.id, req.params.usuario_id);
    res.json({ message: 'Usuario desasignado correctamente' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
