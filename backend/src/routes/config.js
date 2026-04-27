const router = require('express').Router();
const { verificarToken } = require('../middlewares/auth');
const { consultar } = require('../config/database');

router.use(verificarToken);

router.get('/equipos', async (_req, res, next) => {
  try {
    const filas = await consultar(`SELECT id, name as nombre, activo FROM teams WHERE activo = true ORDER BY name`);
    res.json(filas);
  } catch (err) {
    next(err);
  }
});

router.get('/areas', async (_req, res, next) => {
  try {
    const filas = await consultar(`SELECT id, name as nombre, activo FROM areas WHERE activo = true ORDER BY name`);
    res.json(filas);
  } catch (err) {
    next(err);
  }
});

router.get('/grupos', async (_req, res, next) => {
  try {
    const filas = await consultar(`SELECT id, codigo, nombre FROM user_groups ORDER BY nombre`);
    res.json(filas);
  } catch (err) {
    next(err);
  }
});

router.get('/categorias-ingreso', async (_req, res, next) => {
  try {
    const filas = await consultar(`SELECT id, name as nombre, activo FROM income_categories WHERE activo = true ORDER BY name`);
    res.json(filas);
  } catch (err) {
    next(err);
  }
});

router.get('/segmentaciones', async (_req, res, next) => {
  try {
    const filas = await consultar(`SELECT id, nombre, activo FROM segmentations WHERE activo = true ORDER BY nombre`);
    res.json(filas);
  } catch (err) {
    next(err);
  }
});

router.get('/sectores', async (_req, res, next) => {
  try {
    const filas = await consultar(`SELECT id, nombre, activo FROM sectors WHERE activo = true ORDER BY nombre`);
    res.json(filas);
  } catch (err) {
    next(err);
  }
});

router.get('/tipos-servicio', async (_req, res, next) => {
  try {
    const filas = await consultar(`SELECT id, nombre, activo FROM service_types WHERE activo = true ORDER BY nombre`);
    res.json(filas);
  } catch (err) {
    next(err);
  }
});

router.get('/categorias-usuario', async (_req, res, next) => {
  try {
    const filas = await consultar(`SELECT id, name as nombre, activo FROM client_categories WHERE activo = true ORDER BY name`);
    res.json(filas);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
