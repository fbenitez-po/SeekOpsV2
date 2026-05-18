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
    body('codigo').matches(/^[a-zA-Z0-9-]{1,20}$/).withMessage('El código debe ser alfanumérico (guiones permitidos, máx. 20 caracteres)'),
    body('nombre').notEmpty().isLength({ max: 100 }).withMessage('El nombre es requerido (máx. 100 caracteres)'),
    body('cliente_id').isUUID().withMessage('El cliente seleccionado no es válido'),
    body('gestor_id').isUUID().withMessage('El gestor seleccionado no es válido'),
    body('segmentacion_id').isUUID().withMessage('La segmentación seleccionada no es válida'),
    body('categorias_proyecto_ids').optional({ nullable: true }).isArray().withMessage('Las categorías deben ser una lista válida'),
    body('categorias_proyecto_ids.*').isUUID().withMessage('Cada categoría debe ser un valor válido'),
    body('area_id').optional({ nullable: true }).isUUID().withMessage('El área seleccionada no es válida'),
    body('fecha_inicio').optional({ nullable: true }).isDate().withMessage('La fecha de inicio no es válida'),
    body('fecha_fin').optional({ nullable: true }).isDate().withMessage('La fecha de fin no es válida'),
    body('fecha_inicio_real').optional({ nullable: true }).isDate().withMessage('La fecha de inicio real no es válida'),
    body('fecha_fin_real').optional({ nullable: true }).isDate().withMessage('La fecha de fin real no es válida'),
  ],
  validate,
  async (req, res, next) => {
    try {
      res.status(201).json(await service.crear(req.body, req.usuario.email || null));
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
    res.json(await service.actualizar(req.params.id, req.body, req.usuario.email || null));
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/toggle-activo', soloAdmin, async (req, res, next) => {
  try {
    res.json(await service.toggleActivo(req.params.id, req.usuario.email || null));
  } catch (err) {
    next(err);
  }
});

router.post(
  '/:id/usuarios',
  soloAdmin,
  [
    body('usuarios').isArray({ min: 1 }).withMessage('Debe incluir al menos un usuario'),
    body('usuarios.*.usuario_id').isUUID().withMessage('El usuario seleccionado no es válido'),
    body('usuarios.*.rol').isIn(['SEEKER', 'GESTOR']).withMessage('El rol debe ser SEEKER o GESTOR'),
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
