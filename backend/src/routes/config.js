const router = require('express').Router();
const { verificarToken } = require('../middlewares/auth');
const { consultar } = require('../config/database');

router.use(verificarToken);

router.get('/equipos', async (_req, res, next) => {
  try {
    const filas = await consultar(`SELECT id, name as nombre, enabled as activo FROM teams WHERE enabled = true ORDER BY name`);
    res.json(filas);
  } catch (err) {
    next(err);
  }
});

router.get('/areas', async (_req, res, next) => {
  try {
    const filas = await consultar(`SELECT id, name as nombre, enabled as activo FROM areas WHERE enabled = true ORDER BY name`);
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
    const filas = await consultar(`SELECT id, name as nombre, enabled as activo FROM income_categories WHERE enabled = true ORDER BY name`);
    res.json(filas);
  } catch (err) {
    next(err);
  }
});

router.get('/segmentaciones', async (_req, res, next) => {
  try {
    const filas = await consultar(`SELECT id, name as nombre, enabled as activo FROM client_segmentations WHERE enabled = true ORDER BY name`);
    res.json(filas);
  } catch (err) {
    next(err);
  }
});

router.get('/sectores', async (_req, res, next) => {
  try {
    const filas = await consultar(`SELECT id, name as nombre, enabled as activo FROM client_sectors WHERE enabled = true ORDER BY name`);
    res.json(filas);
  } catch (err) {
    next(err);
  }
});

router.get('/segmentaciones-proyecto', async (_req, res, next) => {
  try {
    const filas = await consultar(`SELECT id, name as nombre, enabled as activo FROM project_segmentation WHERE enabled = true ORDER BY name`);
    res.json(filas);
  } catch (err) {
    next(err);
  }
});

router.get('/categorias-proyecto', async (_req, res, next) => {
  try {
    const filas = await consultar(`SELECT id, name as nombre, enabled as activo FROM project_categories WHERE enabled = true ORDER BY name`);
    res.json(filas);
  } catch (err) {
    next(err);
  }
});

router.get('/capas-productividad', async (_req, res, next) => {
  try {
    const filas = await consultar(`SELECT id, name as nombre, enabled as activo FROM productivity_layers WHERE enabled = true ORDER BY name`);
    res.json(filas);
  } catch (err) {
    next(err);
  }
});

router.get('/tipos-servicio', async (_req, res, next) => {
  try {
    const filas = await consultar(`SELECT id, name as nombre, enabled as activo FROM service_types WHERE enabled = true ORDER BY name`);
    res.json(filas);
  } catch (err) {
    next(err);
  }
});

router.get('/work-categories', async (_req, res, next) => {
  try {
    const filas = await consultar(`SELECT id, name as nombre, enabled as activo FROM work_categories WHERE enabled = true ORDER BY name`);
    res.json(filas);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
