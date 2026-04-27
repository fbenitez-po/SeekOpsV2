const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middlewares/validate');
const { verificarToken, soloAdmin } = require('../middlewares/auth');
const service = require('../services/clientService');

router.use(verificarToken, soloAdmin);

const validacionesBase = [
  body('nombre').notEmpty().isLength({ max: 100 }).withMessage('nombre es requerido (max 100)'),
  body('ruc').matches(/^\d{11,14}$/).withMessage('ruc debe tener 11-14 dígitos'),
  body('razon_social').optional({ nullable: true }).isLength({ max: 150 }),
  body('razon_comercial').optional({ nullable: true }).isLength({ max: 150 }),
  body('email_contacto').optional({ nullable: true }).isEmail().withMessage('email_contacto inválido'),
  body('categoria_usuario_id').isUUID().withMessage('categoria_usuario_id inválido'),
  body('segmentacion_id').isUUID().withMessage('segmentacion_id inválido'),
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
