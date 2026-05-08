const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middlewares/validate');
const { verificarToken } = require('../middlewares/auth');
const authService = require('../services/authService');

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('El email ingresado no es válido'),
    body('password').notEmpty().withMessage('La contraseña es requerida'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const resultado = await authService.login(req.body.email, req.body.password);
      res.status(201).json(resultado);
    } catch (err) {
      next(err);
    }
  }
);

router.post('/logout', verificarToken, async (req, res, next) => {
  try {
    const { refresh_token } = req.body;
    if (refresh_token) await authService.logout(refresh_token);
    res.json({ message: 'Sesión cerrada correctamente' });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/refresh-token',
  [body('refresh_token').notEmpty().withMessage('El token de sesión es requerido')],
  validate,
  async (req, res, next) => {
    try {
      const resultado = await authService.renovarToken(req.body.refresh_token);
      res.json(resultado);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/solicitar-reset',
  [body('email').isEmail().withMessage('El email ingresado no es válido')],
  validate,
  async (req, res, next) => {
    try {
      await authService.solicitarReset(req.body.email);
      res.json({ message: 'Si el email existe, recibirás instrucciones en breve.' });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/confirmar-reset',
  [
    body('token').notEmpty().withMessage('El token de recuperación es requerido'),
    body('nueva_password').isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres'),
    body('confirmar_password').notEmpty().withMessage('La confirmación de contraseña es requerida'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { token, nueva_password, confirmar_password } = req.body;
      await authService.confirmarReset(token, nueva_password, confirmar_password);
      res.json({ message: 'Contraseña actualizada correctamente' });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
