const router = require('express').Router();
const { verificarToken, soloAdmin } = require('../middlewares/auth');
const { consultar } = require('../config/database');

router.use(verificarToken, soloAdmin);

const HORAS_USADAS_SUBQUERY = `
  COALESCE((
    SELECT SUM(tel.hours + COALESCE(tel.extra_hours, 0))
    FROM time_entries te
    JOIN time_entry_lines tel ON tel.time_entry_id = te.id
    WHERE te.user_id = c.user_id
      AND te.status = 'APROBADO'
      AND EXTRACT(YEAR FROM to_date(
        (2000 + right(te.week, 2)::int)::text ||
        lpad(split_part(substring(te.week from 2), '/', 1), 3, '0'),
        'IYYYIW'
      )) = pe.year
      AND EXTRACT(MONTH FROM to_date(
        (2000 + right(te.week, 2)::int)::text ||
        lpad(split_part(substring(te.week from 2), '/', 1), 3, '0'),
        'IYYYIW'
      )) = pe.month
  ), 0)`;

// GET /costos-por-persona?periodo_id=...
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
      `SELECT c.id, c.period_id AS periodo_id, c.user_id,
              c.compensation AS remuneracion, c.business_days AS dias_habiles,
              c.hours_per_day AS horas_por_dia,
              pe.month AS mes, pe.year AS anio,
              u.first_name AS nombres, u.last_name AS apellidos, u.email,
              ${HORAS_USADAS_SUBQUERY} AS horas_usadas
       FROM personnel_costs c
       JOIN periods pe ON pe.id = c.period_id
       JOIN users u     ON u.id  = c.user_id
       ${where}
       ORDER BY pe.year DESC, pe.month DESC, u.last_name, u.first_name`,
      params
    );
    res.json(filas);
  } catch (err) {
    next(err);
  }
});

// GET /costos-por-persona/:id
router.get('/:id', async (req, res, next) => {
  try {
    const filas = await consultar(
      `SELECT c.id, c.period_id AS periodo_id, c.user_id,
              c.compensation AS remuneracion, c.business_days AS dias_habiles,
              c.hours_per_day AS horas_por_dia,
              pe.month AS mes, pe.year AS anio,
              u.first_name AS nombres, u.last_name AS apellidos, u.email,
              ${HORAS_USADAS_SUBQUERY} AS horas_usadas
       FROM personnel_costs c
       JOIN periods pe ON pe.id = c.period_id
       JOIN users u     ON u.id  = c.user_id
       WHERE c.id = $1`,
      [req.params.id]
    );
    if (!filas.length) return res.status(404).json({ error: 'Registro no encontrado' });
    res.json(filas[0]);
  } catch (err) {
    next(err);
  }
});

// POST /costos-por-persona
router.post('/', async (req, res, next) => {
  try {
    const { periodo_id, user_id, remuneracion, dias_habiles, horas_por_dia } = req.body;
    if (!periodo_id || !user_id || remuneracion === undefined || remuneracion === null || !dias_habiles) {
      return res.status(400).json({ error: 'periodo_id, user_id, remuneracion y dias_habiles son requeridos' });
    }
    if (Number(remuneracion) < 0) return res.status(400).json({ error: 'La remuneración no puede ser negativa' });
    if (Number(dias_habiles) <= 0) return res.status(400).json({ error: 'Los días hábiles deben ser mayores a 0' });
    const horas = horas_por_dia !== undefined && horas_por_dia !== null ? Number(horas_por_dia) : 8;
    if (horas <= 0) return res.status(400).json({ error: 'Las horas por día deben ser mayores a 0' });

    const filas = await consultar(
      `INSERT INTO personnel_costs (period_id, user_id, compensation, business_days, hours_per_day, created_by, updated_by)
       VALUES ($1, $2, $3, $4, $5, $6, $6)
       RETURNING id, period_id AS periodo_id, user_id, compensation AS remuneracion, business_days AS dias_habiles, hours_per_day AS horas_por_dia`,
      [periodo_id, user_id, Number(remuneracion), Number(dias_habiles), horas, req.usuario.email || null]
    );
    res.status(201).json(filas[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Ya existe un registro para este usuario en este período' });
    next(err);
  }
});

// PUT /costos-por-persona/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { periodo_id, user_id, remuneracion, dias_habiles, horas_por_dia } = req.body;
    if (!periodo_id || !user_id || remuneracion === undefined || remuneracion === null || !dias_habiles) {
      return res.status(400).json({ error: 'periodo_id, user_id, remuneracion y dias_habiles son requeridos' });
    }
    if (Number(remuneracion) < 0) return res.status(400).json({ error: 'La remuneración no puede ser negativa' });
    if (Number(dias_habiles) <= 0) return res.status(400).json({ error: 'Los días hábiles deben ser mayores a 0' });
    const horas = horas_por_dia !== undefined && horas_por_dia !== null ? Number(horas_por_dia) : 8;
    if (horas <= 0) return res.status(400).json({ error: 'Las horas por día deben ser mayores a 0' });

    const filas = await consultar(
      `UPDATE personnel_costs
       SET period_id = $1, user_id = $2, compensation = $3, business_days = $4, hours_per_day = $5,
           updated_at = NOW(), updated_by = $6
       WHERE id = $7
       RETURNING id, period_id AS periodo_id, user_id, compensation AS remuneracion, business_days AS dias_habiles, hours_per_day AS horas_por_dia`,
      [periodo_id, user_id, Number(remuneracion), Number(dias_habiles), horas, req.usuario.email || null, req.params.id]
    );
    if (!filas.length) return res.status(404).json({ error: 'Registro no encontrado' });
    res.json(filas[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Ya existe un registro para este usuario en este período' });
    next(err);
  }
});

// DELETE /costos-por-persona/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const filas = await consultar(
      `DELETE FROM personnel_costs WHERE id = $1 RETURNING id`,
      [req.params.id]
    );
    if (!filas.length) return res.status(404).json({ error: 'Registro no encontrado' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// POST /costos-por-persona/importar
// Body: [{ periodo_id, user_id, remuneracion, dias_habiles, horas_por_dia }]
router.post('/importar', async (req, res, next) => {
  try {
    const filas = req.body;
    if (!Array.isArray(filas) || filas.length === 0) {
      return res.status(400).json({ error: 'Se debe enviar un array con al menos un registro' });
    }

    let insertados = 0;
    let errores = [];

    for (let i = 0; i < filas.length; i++) {
      const { periodo_id, user_id, remuneracion, dias_habiles, horas_por_dia } = filas[i];
      if (!periodo_id || !user_id || remuneracion === undefined || !dias_habiles) {
        errores.push({ fila: i + 1, error: 'Faltan campos requeridos' });
        continue;
      }
      const horas = horas_por_dia !== undefined && horas_por_dia !== null ? Number(horas_por_dia) : 8;
      try {
        await consultar(
          `INSERT INTO personnel_costs (period_id, user_id, compensation, business_days, hours_per_day, created_by, updated_by)
           VALUES ($1, $2, $3, $4, $5, $6, $6)
           ON CONFLICT (period_id, user_id) DO UPDATE
             SET compensation = EXCLUDED.compensation,
                 business_days = EXCLUDED.business_days,
                 hours_per_day = EXCLUDED.hours_per_day,
                 updated_at = NOW(),
                 updated_by = EXCLUDED.updated_by`,
          [periodo_id, user_id, Number(remuneracion), Number(dias_habiles), horas, req.usuario.email || null]
        );
        insertados++;
      } catch (e) {
        errores.push({ fila: i + 1, error: e.message });
      }
    }

    res.json({ insertados, errores });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
