const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middlewares/validate');
const { verificarToken, soloAdmin } = require('../middlewares/auth');
const service = require('../services/userService');

router.use(verificarToken, soloAdmin);

const validacionesBase = [
  body('nombres').notEmpty().isLength({ max: 100 }).withMessage('nombres es requerido (max 100)'),
  body('apellidos').notEmpty().isLength({ max: 100 }).withMessage('apellidos es requerido (max 100)'),
  body('numero_documento').matches(/^\d{6,20}$/).withMessage('numero_documento debe tener 6-20 dígitos'),
  body('puesto').notEmpty().isLength({ max: 100 }).withMessage('puesto es requerido (max 100)'),
  body('celular').optional({ checkFalsy: true }).isMobilePhone('any').withMessage('celular con formato inválido'),
  body('equipo_id').isUUID().withMessage('equipo_id inválido'),
  body('area_id').isUUID().withMessage('area_id inválido'),
  body('fecha_ingreso').isDate().withMessage('fecha_ingreso inválida'),
  body('grupos').isArray({ min: 1 }).withMessage('grupos debe tener al menos un elemento'),
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
  [body('email').isEmail().withMessage('email inválido'), ...validacionesBase],
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
