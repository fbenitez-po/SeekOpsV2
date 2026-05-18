const router = require('express').Router();
const { verificarToken, soloAdmin } = require('../middlewares/auth');
const { consultar } = require('../config/database');

router.use(verificarToken, soloAdmin);

// GET /comercial/tipos-documento
router.get('/tipos-documento', async (_req, res, next) => {
  try {
    const filas = await consultar(
      `SELECT id, nombre FROM tipos_documento WHERE enabled = true ORDER BY nombre`,
      []
    );
    res.json(filas);
  } catch (err) {
    next(err);
  }
});

// GET /comercial
router.get('/', async (req, res, next) => {
  try {
    const { proyecto_id } = req.query;
    const params = [];
    let where = '';
    if (proyecto_id) {
      params.push(proyecto_id);
      where = `WHERE rc.proyecto_id = $${params.length}`;
    }
    const filas = await consultar(
      `SELECT rc.id,
              rc.fecha_registro,
              rc.precio,
              rc.moneda,
              rc.estado_contrato,
              rc.facturacion,
              rc.evidencia_nombre,
              rc.detalle,
              p.id   AS proyecto_id,
              p.code AS proyecto_code,
              p.nombre AS proyecto_nombre,
              u.id       AS responsable_id,
              u.nombres  AS responsable_nombres,
              u.apellidos AS responsable_apellidos,
              td.id     AS tipo_documento_id,
              td.nombre AS tipo_documento_nombre,
              ts.name AS proyecto_tipo,
              seg.name AS proyecto_division,
              p.fecha_inicio,
              p.fecha_fin
       FROM registros_comerciales rc
       JOIN projects p  ON p.id = rc.proyecto_id
       JOIN users u     ON u.id = rc.responsable_id
       LEFT JOIN tipos_documento td ON td.id = rc.tipo_documento_id
       LEFT JOIN service_types ts          ON ts.id  = p.service_type_id
       LEFT JOIN project_segmentation seg ON seg.id = p.project_segmentation_id
       ${where}
       ORDER BY rc.fecha_registro DESC, rc.created_at DESC`,
      params
    );
    res.json(filas);
  } catch (err) {
    next(err);
  }
});

// GET /comercial/:id
router.get('/:id', async (req, res, next) => {
  try {
    const filas = await consultar(
      `SELECT rc.id,
              rc.fecha_registro,
              rc.precio,
              rc.moneda,
              rc.estado_contrato,
              rc.facturacion,
              rc.evidencia_nombre,
              rc.detalle,
              rc.proyecto_id,
              rc.responsable_id,
              rc.tipo_documento_id,
              p.code AS proyecto_code,
              p.nombre AS proyecto_nombre,
              p.fecha_inicio,
              p.fecha_fin,
              ts.name AS proyecto_tipo,
              seg.name AS proyecto_division,
              u.nombres  AS responsable_nombres,
              u.apellidos AS responsable_apellidos,
              td.nombre AS tipo_documento_nombre
       FROM registros_comerciales rc
       JOIN projects p  ON p.id = rc.proyecto_id
       JOIN users u     ON u.id = rc.responsable_id
       LEFT JOIN tipos_documento td ON td.id = rc.tipo_documento_id
       LEFT JOIN service_types ts          ON ts.id  = p.service_type_id
       LEFT JOIN project_segmentation seg ON seg.id = p.project_segmentation_id
       WHERE rc.id = $1`,
      [req.params.id]
    );
    if (!filas.length) return res.status(404).json({ error: 'Registro no encontrado' });
    res.json(filas[0]);
  } catch (err) {
    next(err);
  }
});

// POST /comercial
router.post('/', async (req, res, next) => {
  try {
    const {
      fecha_registro, proyecto_id, responsable_id,
      detalle, precio, tipo_documento_id,
      estado_contrato, facturacion, evidencia_nombre,
    } = req.body;

    if (!fecha_registro || !proyecto_id || !responsable_id || precio === undefined || precio === null) {
      return res.status(400).json({ error: 'fecha_registro, proyecto_id, responsable_id y precio son requeridos' });
    }
    if (Number(precio) < 0) {
      return res.status(400).json({ error: 'El precio no puede ser negativo' });
    }

    const filas = await consultar(
      `INSERT INTO registros_comerciales
         (fecha_registro, proyecto_id, responsable_id, detalle, precio, moneda,
          tipo_documento_id, estado_contrato, facturacion, evidencia_nombre,
          created_by, updated_by)
       VALUES ($1,$2,$3,$4,$5,'PEN',$6,$7,$8,$9,$10,$10)
       RETURNING id`,
      [
        fecha_registro, proyecto_id, responsable_id,
        detalle?.trim() || null, Number(precio),
        tipo_documento_id || null,
        estado_contrato ?? false, facturacion ?? false,
        evidencia_nombre?.trim() || null,
        req.usuario.email || null,
      ]
    );
    res.status(201).json(filas[0]);
  } catch (err) {
    next(err);
  }
});

// PUT /comercial/:id
router.put('/:id', async (req, res, next) => {
  try {
    const {
      fecha_registro, proyecto_id, responsable_id,
      detalle, precio, tipo_documento_id,
      estado_contrato, facturacion, evidencia_nombre,
    } = req.body;

    if (!fecha_registro || !proyecto_id || !responsable_id || precio === undefined || precio === null) {
      return res.status(400).json({ error: 'fecha_registro, proyecto_id, responsable_id y precio son requeridos' });
    }
    if (Number(precio) < 0) {
      return res.status(400).json({ error: 'El precio no puede ser negativo' });
    }

    const filas = await consultar(
      `UPDATE registros_comerciales
       SET fecha_registro = $1, proyecto_id = $2, responsable_id = $3,
           detalle = $4, precio = $5, tipo_documento_id = $6,
           estado_contrato = $7, facturacion = $8, evidencia_nombre = $9,
           updated_at = NOW(), updated_by = $10
       WHERE id = $11
       RETURNING id`,
      [
        fecha_registro, proyecto_id, responsable_id,
        detalle?.trim() || null, Number(precio),
        tipo_documento_id || null,
        estado_contrato ?? false, facturacion ?? false,
        evidencia_nombre?.trim() || null,
        req.usuario.email || null, req.params.id,
      ]
    );
    if (!filas.length) return res.status(404).json({ error: 'Registro no encontrado' });
    res.json(filas[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /comercial/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const filas = await consultar(
      `DELETE FROM registros_comerciales WHERE id = $1 RETURNING id`,
      [req.params.id]
    );
    if (!filas.length) return res.status(404).json({ error: 'Registro no encontrado' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
