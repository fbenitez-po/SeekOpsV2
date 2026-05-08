const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middlewares/validate');
const { verificarToken, soloGestorOAdmin } = require('../middlewares/auth');
const service = require('../services/projectionService');

router.use(verificarToken);
router.use(soloGestorOAdmin);

// GET /projections/alertas — time entries sin proyección vigente
router.get('/alertas', async (req, res, next) => {
  try {
    const { usuario_id, roles } = req.usuario;
    const alertas = await service.listarAlertas(usuario_id, roles);
    res.json({ data: alertas });
  } catch (err) {
    next(err);
  }
});

// GET /projections — listar proyecciones del gestor
router.get('/', async (req, res, next) => {
  try {
    const { usuario_id, roles } = req.usuario;
    const proyecciones = await service.listar(req.query, usuario_id, roles);
    res.json({ data: proyecciones });
  } catch (err) {
    next(err);
  }
});

// POST /projections — crear proyección
router.post(
  '/',
  [
    body('project_id').isUUID().withMessage('El proyecto seleccionado no es válido'),
    body('user_id').isUUID().withMessage('El usuario seleccionado no es válido'),
    body('fecha_inicio').isDate().withMessage('La fecha de inicio no es válida (YYYY-MM-DD)'),
    body('fecha_fin').isDate().withMessage('La fecha de fin no es válida (YYYY-MM-DD)'),
    body('horas_proyectadas').isFloat({ min: 0.5 }).withMessage('Las horas proyectadas deben ser mayor a 0').custom((v) => { if (Number(v) % 0.5 !== 0) throw new Error('Las horas proyectadas deben ser múltiplo de 0.5'); return true; }),
    body('categoria_id').optional({ nullable: true }).isUUID().withMessage('La categoría seleccionada no es válida'),
    body('notas').optional({ nullable: true }).isLength({ max: 500 }).withMessage('Las notas no pueden superar 500 caracteres'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { usuario_id, roles } = req.usuario;
      const proyeccion = await service.crear(req.body, usuario_id, roles);
      res.status(201).json(proyeccion);
    } catch (err) {
      next(err);
    }
  }
);

// PUT /projections/:id — actualizar proyección
router.put(
  '/:id',
  [
    body('fecha_inicio').optional().isDate().withMessage('La fecha de inicio no es válida'),
    body('fecha_fin').optional().isDate().withMessage('La fecha de fin no es válida'),
    body('horas_proyectadas').optional().isFloat({ min: 0.5 }).withMessage('Las horas proyectadas deben ser mayor a 0').custom((v) => { if (Number(v) % 0.5 !== 0) throw new Error('Las horas proyectadas deben ser múltiplo de 0.5'); return true; }),
    body('categoria_id').optional({ nullable: true }).isUUID().withMessage('La categoría seleccionada no es válida'),
    body('notas').optional({ nullable: true }).isLength({ max: 500 }).withMessage('Las notas no pueden superar 500 caracteres'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { usuario_id, roles } = req.usuario;
      const proyeccion = await service.actualizar(req.params.id, req.body, usuario_id, roles);
      res.json(proyeccion);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /projections/:id — eliminar proyección
router.delete('/:id', async (req, res, next) => {
  try {
    const { usuario_id, roles } = req.usuario;
    const result = await service.eliminar(req.params.id, usuario_id, roles);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
