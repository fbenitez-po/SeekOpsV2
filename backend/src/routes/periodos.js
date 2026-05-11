const router = require('express').Router();
const { verificarToken, soloAdmin } = require('../middlewares/auth');
const { consultar } = require('../config/database');

router.use(verificarToken, soloAdmin);

// GET /periodos — devuelve periodos hasta el mes actual (inclusive), más recientes primero
router.get('/', async (_req, res, next) => {
  try {
    const ahora = new Date();
    const mesActual = ahora.getMonth() + 1;
    const anioActual = ahora.getFullYear();

    const filas = await consultar(
      `SELECT id, mes, anio, esta_cerrado, updated_at
       FROM periodos
       WHERE (anio < $1) OR (anio = $1 AND mes <= $2)
       ORDER BY anio DESC, mes DESC`,
      [anioActual, mesActual]
    );
    res.json(filas);
  } catch (err) {
    next(err);
  }
});

// PATCH /periodos/:id/toggle — abre o cierra un periodo
router.patch('/:id/toggle', async (req, res, next) => {
  try {
    const { id } = req.params;
    const filas = await consultar(
      `UPDATE periodos
       SET esta_cerrado = NOT esta_cerrado, updated_at = NOW()
       WHERE id = $1
       RETURNING id, mes, anio, esta_cerrado, updated_at`,
      [id]
    );
    if (!filas.length) return res.status(404).json({ error: 'Periodo no encontrado' });
    res.json(filas[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
