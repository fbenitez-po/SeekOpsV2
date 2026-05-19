const router = require('express').Router();
const { verificarToken, soloAdmin } = require('../middlewares/auth');
const { consultar } = require('../config/database');

router.use(verificarToken, soloAdmin);

// GET /ingresos?periodo_id=...
router.get('/', async (req, res, next) => {
  try {
    const { periodo_id } = req.query;
    const params = [];
    let where = '';
    if (periodo_id) {
      params.push(periodo_id);
      where = `WHERE i.period_id = $${params.length}`;
    }

    const filas = await consultar(
      `SELECT
         i.id,
         i.amount AS monto,
         p.id   AS proyecto_id,
         p.code AS proyecto_code,
         p.name AS proyecto_nombre,
         pe.month AS mes,
         pe.year AS anio
       FROM revenues i
       JOIN projects p  ON p.id = i.project_id
       JOIN periods pe ON pe.id = i.period_id
       ${where}
       ORDER BY pe.year DESC, pe.month DESC, p.code`,
      params
    );
    res.json(filas);
  } catch (err) {
    next(err);
  }
});

// POST /ingresos
router.post('/', async (req, res, next) => {
  try {
    const { proyecto_id, periodo_id, monto } = req.body;
    if (!proyecto_id || !periodo_id || monto === undefined || monto === null) {
      return res.status(400).json({ error: 'proyecto_id, periodo_id y monto son requeridos' });
    }
    if (Number(monto) < 0) {
      return res.status(400).json({ error: 'El monto no puede ser negativo' });
    }

    const filas = await consultar(
      `INSERT INTO revenues (project_id, period_id, amount, created_by, updated_by)
       VALUES ($1, $2, $3, $4, $4)
       RETURNING id, project_id AS proyecto_id, period_id AS periodo_id, amount AS monto`,
      [proyecto_id, periodo_id, monto, req.usuario.email || null]
    );
    res.status(201).json(filas[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Ya existe un ingreso para ese proyecto y período' });
    next(err);
  }
});

// PUT /ingresos/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { monto } = req.body;
    if (monto === undefined || monto === null) {
      return res.status(400).json({ error: 'monto es requerido' });
    }
    if (Number(monto) < 0) {
      return res.status(400).json({ error: 'El monto no puede ser negativo' });
    }

    const filas = await consultar(
      `UPDATE revenues
       SET amount = $1, updated_at = NOW(), updated_by = $2
       WHERE id = $3
       RETURNING id, project_id AS proyecto_id, period_id AS periodo_id, amount AS monto`,
      [monto, req.usuario.email || null, req.params.id]
    );
    if (!filas.length) return res.status(404).json({ error: 'Ingreso no encontrado' });
    res.json(filas[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /ingresos/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const filas = await consultar(
      `DELETE FROM revenues WHERE id = $1 RETURNING id`,
      [req.params.id]
    );
    if (!filas.length) return res.status(404).json({ error: 'Ingreso no encontrado' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// POST /ingresos/importar
// Body: [{ code, ingreso, period }]  — period: "DD/MM/YYYY"
router.post('/importar', async (req, res, next) => {
  try {
    const filas = req.body;
    if (!Array.isArray(filas) || filas.length === 0) {
      return res.status(400).json({ error: 'El cuerpo debe ser un array con al menos un registro' });
    }

    const resultados = { insertados: 0, actualizados: 0, errores: [] };

    for (const fila of filas) {
      const { code, ingreso, period } = fila;
      if (!code || ingreso === undefined || !period) {
        resultados.errores.push({ fila, motivo: 'Faltan campos requeridos (code, ingreso, period)' });
        continue;
      }

      // Parsear fecha DD/MM/YYYY
      const partes = String(period).split('/');
      if (partes.length !== 3) {
        resultados.errores.push({ fila, motivo: 'Formato de fecha inválido, se espera DD/MM/YYYY' });
        continue;
      }
      const mes = parseInt(partes[1], 10);
      const anio = parseInt(partes[2], 10);
      if (!mes || !anio || mes < 1 || mes > 12) {
        resultados.errores.push({ fila, motivo: 'Fecha inválida' });
        continue;
      }

      if (Number(ingreso) < 0) {
        resultados.errores.push({ fila, motivo: 'El ingreso no puede ser negativo' });
        continue;
      }

      // Buscar proyecto por code
      const proyecto = await consultar(`SELECT id FROM projects WHERE code = $1 AND is_active = true`, [String(code)]);
      if (!proyecto.length) {
        resultados.errores.push({ fila, motivo: `Proyecto con código "${code}" no encontrado o inactivo` });
        continue;
      }

      // Buscar período
      const periodo = await consultar(`SELECT id FROM periods WHERE month = $1 AND year = $2`, [mes, anio]);
      if (!periodo.length) {
        resultados.errores.push({ fila, motivo: `Período ${mes}/${anio} no existe en el sistema` });
        continue;
      }

      // Upsert
      const resultado = await consultar(
        `INSERT INTO revenues (project_id, period_id, amount, created_by, updated_by)
         VALUES ($1, $2, $3, $4, $4)
         ON CONFLICT (project_id, period_id)
         DO UPDATE SET amount = EXCLUDED.amount, updated_at = NOW(), updated_by = $4
         RETURNING (xmax = 0) AS es_nuevo`,
        [proyecto[0].id, periodo[0].id, ingreso, req.usuario.email || null]
      );

      if (resultado[0].es_nuevo) resultados.insertados++;
      else resultados.actualizados++;
    }

    res.json(resultados);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
