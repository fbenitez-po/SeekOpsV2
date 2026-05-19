const router = require('express').Router();
const { verificarToken } = require('../middlewares/auth');
const { consultar } = require('../config/database');

router.use(verificarToken);

router.get('/equipos', async (_req, res, next) => {
  try {
    const filas = await consultar(`SELECT id, name as nombre, is_active as activo FROM teams WHERE is_active = true ORDER BY name`);
    res.json(filas);
  } catch (err) {
    next(err);
  }
});

router.get('/areas', async (_req, res, next) => {
  try {
    const filas = await consultar(`SELECT id, name as nombre, is_active as activo FROM areas WHERE is_active = true ORDER BY name`);
    res.json(filas);
  } catch (err) {
    next(err);
  }
});

router.get('/grupos', async (_req, res, next) => {
  try {
    const filas = await consultar(`SELECT id, code AS codigo, name AS nombre FROM profiles ORDER BY name`);
    res.json(filas);
  } catch (err) {
    next(err);
  }
});

router.get('/categorias-ingreso', async (_req, res, next) => {
  try {
    const filas = await consultar(`SELECT id, name as nombre, is_active as activo FROM income_categories WHERE is_active = true ORDER BY name`);
    res.json(filas);
  } catch (err) {
    next(err);
  }
});

router.get('/segmentaciones', async (_req, res, next) => {
  try {
    const filas = await consultar(`SELECT id, name as nombre, is_active as activo FROM client_segmentations WHERE is_active = true ORDER BY name`);
    res.json(filas);
  } catch (err) {
    next(err);
  }
});

router.get('/sectores', async (_req, res, next) => {
  try {
    const filas = await consultar(`SELECT id, name as nombre, is_active as activo FROM client_sectors WHERE is_active = true ORDER BY name`);
    res.json(filas);
  } catch (err) {
    next(err);
  }
});

router.get('/segmentaciones-proyecto', async (_req, res, next) => {
  try {
    const filas = await consultar(`SELECT id, name as nombre, is_active as activo FROM project_segmentation WHERE is_active = true ORDER BY name`);
    res.json(filas);
  } catch (err) {
    next(err);
  }
});

router.get('/categorias-proyecto', async (_req, res, next) => {
  try {
    const filas = await consultar(`SELECT id, name as nombre, is_active as activo FROM project_categories WHERE is_active = true ORDER BY name`);
    res.json(filas);
  } catch (err) {
    next(err);
  }
});

router.get('/capas-productividad', async (_req, res, next) => {
  try {
    const filas = await consultar(`SELECT id, name as nombre, is_active as activo FROM productivity_layers WHERE is_active = true ORDER BY name`);
    res.json(filas);
  } catch (err) {
    next(err);
  }
});

router.get('/tipos-servicio', async (_req, res, next) => {
  try {
    const filas = await consultar(`SELECT id, name as nombre, is_active as activo FROM service_types WHERE is_active = true ORDER BY name`);
    res.json(filas);
  } catch (err) {
    next(err);
  }
});

router.get('/work-categories', async (_req, res, next) => {
  try {
    const filas = await consultar(`SELECT id, name as nombre, is_active as activo FROM work_categories WHERE is_active = true ORDER BY name`);
    res.json(filas);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
