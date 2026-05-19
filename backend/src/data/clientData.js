const { consultar, consultarUno, pool } = require('../config/database');

async function listarClientes(filtros) {
  const params = [];
  const condiciones = [];
  let idx = 1;

  if (filtros.activo !== undefined) {
    params.push(filtros.activo === 'true');
    condiciones.push(`c.is_active = $${idx++}`);
  }
  if (filtros.search) {
    params.push(`%${filtros.search}%`);
    condiciones.push(`(c.legal_name ILIKE $${idx} OR c.trade_name ILIKE $${idx} OR c.ruc ILIKE $${idx++})`);
  }
  if (filtros.segmentacion_id) {
    params.push(filtros.segmentacion_id);
    condiciones.push(`c.segmentation_id = $${idx++}`);
  }

  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
  const limite = Math.min(parseInt(filtros.limit) || 20, 100);
  const offset = ((parseInt(filtros.page) || 1) - 1) * limite;

  const sql = `
    SELECT c.id, c.legal_name AS razon_social, c.trade_name AS razon_comercial, c.ruc,
           c.contact_name AS nombre_contacto, c.contact_email AS email_contacto,
           c.phone AS telefono, c.address AS direccion,
           c.is_active as activo, c.created_at,
           s.id as seg_id, s.name as seg_nombre,
           sec.id as sec_id, sec.name as sec_nombre,
           (SELECT COUNT(*) FROM projects p WHERE p.client_id = c.id) as proyectos_count
    FROM clients c
    LEFT JOIN client_segmentations s ON s.id = c.segmentation_id
    LEFT JOIN client_sectors sec ON sec.id = c.sector_id
    ${where}
    ORDER BY c.legal_name
    LIMIT $${params.length + 1} OFFSET $${params.length + 2}
  `;

  const [clientes, [conteo]] = await Promise.all([
    consultar(sql, [...params, limite, offset]),
    consultar(`SELECT COUNT(*) as total FROM clients c ${where}`, params),
  ]);

  return { clientes, total: parseInt(conteo.total) };
}

async function buscarClientePorId(id) {
  return consultarUno(
    `SELECT c.id, c.legal_name AS razon_social, c.trade_name AS razon_comercial, c.ruc,
            c.contact_name AS nombre_contacto, c.contact_email AS email_contacto,
            c.phone AS telefono, c.address AS direccion,
            c.is_active as activo, c.created_at, c.updated_at,
            s.id as seg_id, s.name as seg_nombre,
            sec.id as sec_id, sec.name as sec_nombre
     FROM clients c
     LEFT JOIN client_segmentations s ON s.id = c.segmentation_id
     LEFT JOIN client_sectors sec ON sec.id = c.sector_id
     WHERE c.id = $1`,
    [id]
  );
}

async function obtenerProyectosDeCliente(clienteId) {
  return consultar(
    `SELECT id, name AS nombre, code as codigo, is_active as activo FROM projects WHERE client_id = $1 ORDER BY name`,
    [clienteId]
  );
}

async function rucExiste(ruc, excluirId = null) {
  const sql = excluirId
    ? `SELECT 1 FROM clients WHERE ruc = $1 AND id != $2`
    : `SELECT 1 FROM clients WHERE ruc = $1`;
  return consultarUno(sql, excluirId ? [ruc, excluirId] : [ruc]);
}

async function crearCliente(datos, email) {
  const { rows: [cliente] } = await pool.query(
    `INSERT INTO clients (legal_name, trade_name, ruc, contact_name,
                          contact_email, phone, address,
                          segmentation_id, sector_id, is_active,
                          created_by, updated_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$11)
     RETURNING id, legal_name AS razon_social, ruc, is_active as activo, created_at`,
    [
      datos.razon_social, datos.razon_comercial || null,
      datos.ruc, datos.nombre_contacto || null, datos.email_contacto || null,
      datos.telefono || null, datos.direccion || null,
      datos.segmentacion_id, datos.sector_id || null,
      datos.activo !== false,
      email || null,
    ]
  );
  return cliente;
}

async function actualizarCliente(id, datos, email) {
  const campos = [];
  const params = [];
  let idx = 1;

  const mapeados = {
    legal_name: datos.razon_social,
    trade_name: datos.razon_comercial,
    ruc: datos.ruc,
    contact_name: datos.nombre_contacto,
    contact_email: datos.email_contacto,
    phone: datos.telefono,
    address: datos.direccion,
    segmentation_id: datos.segmentacion_id,
    sector_id: datos.sector_id,
    is_active: datos.activo,
  };

  for (const [campo, valor] of Object.entries(mapeados)) {
    if (valor !== undefined) {
      campos.push(`${campo} = $${idx++}`);
      params.push(valor);
    }
  }

  if (!campos.length) return buscarClientePorId(id);
  campos.push(`updated_at = NOW()`, `updated_by = $${idx++}`);
  params.push(email || null, id);

  const { rows: [cliente] } = await pool.query(
    `UPDATE clients SET ${campos.join(', ')} WHERE id = $${idx} RETURNING id, legal_name AS razon_social, updated_at`,
    params
  );
  return cliente;
}

async function toggleActivo(id, email) {
  const { rows: [cliente] } = await pool.query(
    `UPDATE clients
     SET is_active = NOT is_active,
         deleted_at = CASE WHEN is_active THEN NOW() ELSE NULL END,
         deleted_by = CASE WHEN is_active THEN $2 ELSE NULL END,
         updated_at = NOW(),
         updated_by = $2
     WHERE id = $1
     RETURNING id, is_active as activo, updated_at`,
    [id, email || null]
  );
  return cliente;
}

module.exports = {
  listarClientes,
  buscarClientePorId,
  obtenerProyectosDeCliente,
  rucExiste,
  crearCliente,
  actualizarCliente,
  toggleActivo,
};
