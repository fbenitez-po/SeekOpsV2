const router = require('express').Router();
const { verificarToken, soloAdmin } = require('../middlewares/auth');
const { consultar } = require('../config/database');

router.use(verificarToken, soloAdmin);

// GET /comercial/tipos-documento
router.get('/tipos-documento', async (_req, res, next) => {
  try {
    const filas = await consultar(
      `SELECT id, name AS nombre FROM document_types WHERE is_active = true ORDER BY name`,
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
      where = `WHERE rc.project_id = $${params.length}`;
    }
    const filas = await consultar(
      `SELECT rc.id,
              rc.record_date AS fecha_registro,
              rc.price AS precio,
              rc.currency AS moneda,
              rc.has_contract AS estado_contrato,
              rc.is_billed AS facturacion,
              rc.evidence_filename AS evidencia_nombre,
              rc.detail AS detalle,
              p.id   AS proyecto_id,
              p.code AS proyecto_code,
              p.name AS proyecto_nombre,
              u.id       AS responsable_id,
              u.first_name  AS responsable_nombres,
              u.last_name AS responsable_apellidos,
              td.id     AS tipo_documento_id,
              td.name AS tipo_documento_nombre,
              ts.name AS proyecto_tipo,
              seg.name AS proyecto_division,
              p.start_date AS fecha_inicio,
              p.end_date AS fecha_fin
       FROM commercial_records rc
       JOIN projects p  ON p.id = rc.project_id
       JOIN users u     ON u.id = rc.owner_id
       LEFT JOIN document_types td ON td.id = rc.document_type_id
       LEFT JOIN service_types ts          ON ts.id  = p.service_type_id
       LEFT JOIN project_segmentation seg ON seg.id = p.project_segmentation_id
       ${where}
       ORDER BY rc.record_date DESC, rc.created_at DESC`,
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
              rc.record_date AS fecha_registro,
              rc.price AS precio,
              rc.currency AS moneda,
              rc.has_contract AS estado_contrato,
              rc.is_billed AS facturacion,
              rc.evidence_filename AS evidencia_nombre,
              rc.detail AS detalle,
              rc.project_id AS proyecto_id,
              rc.owner_id AS responsable_id,
              rc.document_type_id AS tipo_documento_id,
              p.code AS proyecto_code,
              p.name AS proyecto_nombre,
              p.start_date AS fecha_inicio,
              p.end_date AS fecha_fin,
              ts.name AS proyecto_tipo,
              seg.name AS proyecto_division,
              u.first_name  AS responsable_nombres,
              u.last_name AS responsable_apellidos,
              td.name AS tipo_documento_nombre
       FROM commercial_records rc
       JOIN projects p  ON p.id = rc.project_id
       JOIN users u     ON u.id = rc.owner_id
       LEFT JOIN document_types td ON td.id = rc.document_type_id
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
      `INSERT INTO commercial_records
         (record_date, project_id, owner_id, detail, price, currency,
          document_type_id, has_contract, is_billed, evidence_filename,
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
      `UPDATE commercial_records
       SET record_date = $1, project_id = $2, owner_id = $3,
           detail = $4, price = $5, document_type_id = $6,
           has_contract = $7, is_billed = $8, evidence_filename = $9,
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
      `DELETE FROM commercial_records WHERE id = $1 RETURNING id`,
      [req.params.id]
    );
    if (!filas.length) return res.status(404).json({ error: 'Registro no encontrado' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
