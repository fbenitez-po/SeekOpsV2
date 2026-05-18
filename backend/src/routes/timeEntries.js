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
    body('semana').matches(/^S\d{2}\/\d{2}$/).withMessage('La semana debe tener formato S15/26'),
    body('lineas').isArray({ min: 1 }).withMessage('Debe agregar al menos una línea de horas'),
    body('lineas.*.proyecto_id').isUUID().withMessage('El proyecto seleccionado no es válido'),
    body('lineas.*.horas').isFloat({ min: 0 }).withMessage('Las horas deben ser un número mayor o igual a 0').custom((v) => { if (Number(v) % 0.5 !== 0) throw new Error('Las horas deben ser múltiplo de 0.5'); return true; }),
    body('lineas.*.horas_extra').optional().isFloat({ min: 0, max: 8 }).withMessage('Las horas extra deben estar entre 0 y 8').custom((v) => { if (Number(v) % 0.5 !== 0) throw new Error('Las horas extra deben ser múltiplo de 0.5'); return true; }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { usuario_id, email, roles } = req.usuario;
      const resultado = await service.crear(usuario_id, email || null, roles, req.body);
      res.status(201).json(resultado);
    } catch (err) {
      next(err);
    }
  }
);

router.get('/semanas-sin-carga', async (req, res, next) => {
  try {
    const { usuario_id } = req.usuario;
    const resultado = await service.obtenerSemanasSinCarga(usuario_id);
    res.json(resultado);
  } catch (err) {
    next(err);
  }
});

router.get('/seekers-sin-carga', async (req, res, next) => {
  try {
    const { usuario_id, roles } = req.usuario;
    const resultado = await service.obtenerSeekersSinCarga(usuario_id, roles);
    res.json(resultado);
  } catch (err) {
    next(err);
  }
});

router.post('/seekers-sin-carga/:userId/recordatorio', async (req, res, next) => {
  try {
    const { usuario_id, roles } = req.usuario;
    const resultado = await service.enviarRecordatorio(usuario_id, req.params.userId, roles);
    res.json(resultado);
  } catch (err) {
    next(err);
  }
});

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
    body('lineas').isArray({ min: 1 }).withMessage('Debe incluir al menos una línea'),
    body('lineas.*.id').isUUID().withMessage('Una de las líneas tiene un identificador inválido'),
    body('lineas.*.horas').isFloat({ min: 0 }).withMessage('Las horas deben ser un número mayor o igual a 0').custom((v) => { if (Number(v) % 0.5 !== 0) throw new Error('Las horas deben ser múltiplo de 0.5'); return true; }),
    body('lineas.*.horas_extra').optional().isFloat({ min: 0, max: 8 }).withMessage('Las horas extra deben estar entre 0 y 8').custom((v) => { if (Number(v) % 0.5 !== 0) throw new Error('Las horas extra deben ser múltiplo de 0.5'); return true; }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { usuario_id, email } = req.usuario;
      const resultado = await service.ajustar(req.params.id, usuario_id, email || null, req.body.lineas);
      res.json(resultado);
    } catch (err) {
      next(err);
    }
  }
);

router.post('/:id/aprobar', async (req, res, next) => {
  try {
    const { usuario_id, email, roles } = req.usuario;
    const resultado = await service.aprobar(req.params.id, usuario_id, email || null, roles);
    res.json(resultado);
  } catch (err) {
    next(err);
  }
});

router.post(
  '/:id/aprobar-con-observacion',
  [body('comentario_observacion').notEmpty().withMessage('El comentario es requerido')],
  validate,
  async (req, res, next) => {
    try {
      const { usuario_id, email, roles } = req.usuario;
      const resultado = await service.aprobarConObservacion(req.params.id, usuario_id, email || null, roles, req.body);
      res.json(resultado);
    } catch (err) {
      next(err);
    }
  }
);


router.post(
  '/:id/rechazar',
  [body('razon_rechazo').notEmpty().withMessage('La razón de rechazo es requerida')],
  validate,
  async (req, res, next) => {
    try {
      const { usuario_id, email, roles } = req.usuario;
      const resultado = await service.rechazar(req.params.id, usuario_id, email || null, roles, req.body);
      res.json(resultado);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
