const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middlewares/validate');
const { verificarToken, soloAdmin } = require('../middlewares/auth');
const service = require('../services/userService');

router.use(verificarToken, soloAdmin);

const validacionesBase = [
  body('nombres').notEmpty().isLength({ max: 100 }).withMessage('El nombre es requerido (máx. 100 caracteres)'),
  body('apellidos').notEmpty().isLength({ max: 100 }).withMessage('Los apellidos son requeridos (máx. 100 caracteres)'),
  body('numero_documento').matches(/^\d{6,20}$/).withMessage('El número de documento debe tener entre 6 y 20 dígitos'),
  body('puesto').notEmpty().isLength({ max: 100 }).withMessage('El puesto es requerido (máx. 100 caracteres)'),
  body('celular').optional({ checkFalsy: true }).isMobilePhone('any').withMessage('El celular tiene un formato inválido'),
  body('equipo_id').isUUID().withMessage('El equipo seleccionado no es válido'),
  body('areas').isArray({ min: 1 }).withMessage('Debe seleccionar al menos un área'),
  body('areas.*').isUUID().withMessage('Cada área debe ser un valor válido'),
  body('fecha_ingreso').isDate().withMessage('La fecha de ingreso no es válida'),
  body('grupos').isArray({ min: 1 }).withMessage('Debe seleccionar al menos un grupo'),
];

router.get('/', async (req, res, next) => {
  try {
    res.json(await service.listar(req.query));
  } catch (err) {
    next(err);
  }
});

router.post(
  '/',
  [body('email').isEmail().withMessage('El email no tiene un formato válido'), ...validacionesBase],
  validate,
  async (req, res, next) => {
    try {
      const resultado = await service.crear(req.body);
      res.status(201).json(resultado);
    } catch (err) {
      next(err);
    }
  }
);

router.get('/:id', async (req, res, next) => {
  try {
    res.json(await service.obtenerPorId(req.params.id));
  } catch (err) {
    next(err);
  }
});

router.put('/:id', validacionesBase, validate, async (req, res, next) => {
  try {
    res.json(await service.actualizar(req.params.id, req.body));
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/toggle-activo', async (req, res, next) => {
  try {
    res.json(await service.toggleActivo(req.params.id));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
