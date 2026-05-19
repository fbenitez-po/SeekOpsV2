const router = require('express').Router();
const { verificarToken, soloAdmin } = require('../middlewares/auth');
const { consultar } = require('../config/database');

router.use(verificarToken, soloAdmin);

// GET /costos-venta?periodo_id=...
router.get('/', async (req, res, next) => {
  try {
    const { periodo_id } = req.query;
    const params = [];
    let where = '';
    if (periodo_id) {
      params.push(periodo_id);
      where = `WHERE c.period_id = $${params.length}`;
    }
    const filas = await consultar(
      `SELECT c.id, c.code AS codigo, c.description AS descripcion, c.amount AS monto,
              pe.month AS mes, pe.year AS anio, c.period_id AS periodo_id
       FROM sales_costs c
       JOIN periods pe ON pe.id = c.period_id
       ${where}
       ORDER BY pe.year DESC, pe.month DESC, c.code`,
      params
    );
    res.json(filas);
  } catch (err) {
    next(err);
  }
});

// GET /costos-venta/:id
router.get('/:id', async (req, res, next) => {
  try {
    const filas = await consultar(
      `SELECT c.id, c.code AS codigo, c.description AS descripcion, c.amount AS monto,
              c.period_id AS periodo_id, pe.month AS mes, pe.year AS anio
       FROM sales_costs c
       JOIN periods pe ON pe.id = c.period_id
       WHERE c.id = $1`,
      [req.params.id]
    );
    if (!filas.length) return res.status(404).json({ error: 'Costo de venta no encontrado' });
    res.json(filas[0]);
  } catch (err) {
    next(err);
  }
});

// POST /costos-venta
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
      `INSERT INTO sales_costs (period_id, code, description, amount, created_by, updated_by)
       VALUES ($1, $2, $3, $4, $5, $5)
       RETURNING id, period_id AS periodo_id, code AS codigo, description AS descripcion, amount AS monto`,
      [periodo_id, codigo.trim(), descripcion?.trim() || null, monto, req.usuario.email || null]
    );
    res.status(201).json(filas[0]);
  } catch (err) {
    next(err);
  }
});

// PUT /costos-venta/:id
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
      `UPDATE sales_costs
       SET period_id = $1, code = $2, description = $3, amount = $4,
           updated_at = NOW(), updated_by = $5
       WHERE id = $6
       RETURNING id, period_id AS periodo_id, code AS codigo, description AS descripcion, amount AS monto`,
      [periodo_id, codigo.trim(), descripcion?.trim() || null, monto, req.usuario.email || null, req.params.id]
    );
    if (!filas.length) return res.status(404).json({ error: 'Costo de venta no encontrado' });
    res.json(filas[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /costos-venta/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const filas = await consultar(
      `DELETE FROM sales_costs WHERE id = $1 RETURNING id`,
      [req.params.id]
    );
    if (!filas.length) return res.status(404).json({ error: 'Costo de venta no encontrado' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
