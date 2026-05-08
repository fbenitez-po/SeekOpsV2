const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middlewares/validate');
const { verificarToken, soloAdmin } = require('../middlewares/auth');
const service = require('../services/clientService');

router.use(verificarToken, soloAdmin);

const validacionesBase = [
  body('nombre').notEmpty().isLength({ max: 100 }).withMessage('El nombre es requerido (máximo 100 caracteres)'),
  body('ruc').matches(/^\d{11,14}$/).withMessage('El RUC debe tener entre 11 y 14 dígitos'),
  body('razon_social').optional({ nullable: true }).isLength({ max: 150 }),
  body('razon_comercial').optional({ nullable: true }).isLength({ max: 150 }),
  body('email_contacto').optional({ nullable: true }).isEmail().withMessage('El email de contacto no es válido'),
  body('segmentacion_id').isUUID().withMessage('La segmentación seleccionada no es válida'),
];

router.get('/', async (req, res, next) => {
  try {
    res.json(await service.listar(req.query));
  } catch (err) {
    next(err);
  }
});

router.post('/', validacionesBase, validate, async (req, res, next) => {
  try {
    res.status(201).json(await service.crear(req.body));
  } catch (err) {
    next(err);
  }
});

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
