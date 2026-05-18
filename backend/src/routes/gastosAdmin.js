const router = require('express').Router();
const { verificarToken, soloAdmin } = require('../middlewares/auth');
const { consultar } = require('../config/database');

router.use(verificarToken, soloAdmin);

// GET /gastos-admin?periodo_id=...
router.get('/', async (req, res, next) => {
  try {
    const { periodo_id } = req.query;
    const params = [];
    let where = '';
    if (periodo_id) {
      params.push(periodo_id);
      where = `WHERE g.periodo_id = $${params.length}`;
    }
    const filas = await consultar(
      `SELECT g.id, g.codigo, g.descripcion, g.monto, pe.mes, pe.anio, g.periodo_id
       FROM gastos_admin g
       JOIN periodos pe ON pe.id = g.periodo_id
       ${where}
       ORDER BY pe.anio DESC, pe.mes DESC, g.codigo`,
      params
    );
    res.json(filas);
  } catch (err) {
    next(err);
  }
});

// GET /gastos-admin/:id
router.get('/:id', async (req, res, next) => {
  try {
    const filas = await consultar(
      `SELECT g.id, g.codigo, g.descripcion, g.monto, g.periodo_id, pe.mes, pe.anio
       FROM gastos_admin g
       JOIN periodos pe ON pe.id = g.periodo_id
       WHERE g.id = $1`,
      [req.params.id]
    );
    if (!filas.length) return res.status(404).json({ error: 'Gasto no encontrado' });
    res.json(filas[0]);
  } catch (err) {
    next(err);
  }
});

// POST /gastos-admin
router.post('/', async (req, res, next) => {
  try {
    const { periodo_id, codigo, descripcion, monto } = req.body;
    if (!periodo_id || !codigo || monto === undefined || monto === null) {
      return res.status(400).json({ error: 'periodo_id, codigo y monto son requeridos' });
    }
    if (Number(monto) < 0) {
      return res.status(400).json({ error: 'El monto no puede ser negativo' });
    }
    const filas = await consultar(
      `INSERT INTO gastos_admin (periodo_id, codigo, descripcion, monto, created_by, updated_by)
       VALUES ($1, $2, $3, $4, $5, $5)
       RETURNING id, periodo_id, codigo, descripcion, monto`,
      [periodo_id, codigo.trim(), descripcion?.trim() || null, monto, req.usuario.email || null]
    );
    res.status(201).json(filas[0]);
  } catch (err) {
    next(err);
  }
});

// PUT /gastos-admin/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { periodo_id, codigo, descripcion, monto } = req.body;
    if (!periodo_id || !codigo || monto === undefined || monto === null) {
      return res.status(400).json({ error: 'periodo_id, codigo y monto son requeridos' });
    }
    if (Number(monto) < 0) {
      return res.status(400).json({ error: 'El monto no puede ser negativo' });
    }
    const filas = await consultar(
      `UPDATE gastos_admin
       SET periodo_id = $1, codigo = $2, descripcion = $3, monto = $4,
           updated_at = NOW(), updated_by = $5
       WHERE id = $6
       RETURNING id, periodo_id, codigo, descripcion, monto`,
      [periodo_id, codigo.trim(), descripcion?.trim() || null, monto, req.usuario.email || null, req.params.id]
    );
    if (!filas.length) return res.status(404).json({ error: 'Gasto no encontrado' });
    res.json(filas[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /gastos-admin/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const filas = await consultar(
      `DELETE FROM gastos_admin WHERE id = $1 RETURNING id`,
      [req.params.id]
    );
    if (!filas.length) return res.status(404).json({ error: 'Gasto no encontrado' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
