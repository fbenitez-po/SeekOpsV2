const { consultar, consultarUno, pool } = require('../config/database');

async function listarClientes(filtros) {
  const params = [];
  const condiciones = [];
  let idx = 1;

  if (filtros.activo !== undefined) {
    params.push(filtros.activo === 'true');
    condiciones.push(`c.activo = $${idx++}`);
  }
  if (filtros.search) {
    params.push(`%${filtros.search}%`);
    condiciones.push(`(c.nombre ILIKE $${idx} OR c.ruc ILIKE $${idx++})`);
  }
  if (filtros.segmentacion_id) {
    params.push(filtros.segmentacion_id);
    condiciones.push(`c.segmentation_id = $${idx++}`);
  }

  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
  const limite = Math.min(parseInt(filtros.limit) || 20, 100);
  const offset = ((parseInt(filtros.page) || 1) - 1) * limite;

  const sql = `
    SELECT c.id, c.nombre, c.razon_social, c.razon_comercial, c.ruc,
           c.nombre_contacto, c.email_contacto, c.telefono, c.direccion, c.activo, c.created_at,
           cu.id as cat_id, cu.name as cat_nombre,
           s.id as seg_id, s.nombre as seg_nombre,
           sec.id as sec_id, sec.nombre as sec_nombre,
           (SELECT COUNT(*) FROM projects p WHERE p.client_id = c.id) as proyectos_count
    FROM clients c
    LEFT JOIN client_categories cu ON cu.id = c.client_category_id
    LEFT JOIN client_segmentations s ON s.id = c.segmentation_id
    LEFT JOIN client_sectors sec ON sec.id = c.sector_id
    ${where}
    ORDER BY c.nombre
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
    `SELECT c.id, c.nombre, c.razon_social, c.razon_comercial, c.ruc,
            c.nombre_contacto, c.email_contacto, c.telefono, c.direccion, c.activo,
            c.created_at, c.updated_at,
            cu.id as cat_id, cu.name as cat_nombre,
            s.id as seg_id, s.nombre as seg_nombre,
            sec.id as sec_id, sec.nombre as sec_nombre
     FROM clients c
     LEFT JOIN client_categories cu ON cu.id = c.client_category_id
     LEFT JOIN client_segmentations s ON s.id = c.segmentation_id
     LEFT JOIN client_sectors sec ON sec.id = c.sector_id
     WHERE c.id = $1`,
    [id]
  );
}

async function obtenerProyectosDeCliente(clienteId) {
  return consultar(
    `SELECT id, nombre, code as codigo, activo FROM projects WHERE client_id = $1 ORDER BY nombre`,
    [clienteId]
  );
}

async function rucExiste(ruc, excluirId = null) {
  const sql = excluirId
    ? `SELECT 1 FROM clients WHERE ruc = $1 AND id != $2`
    : `SELECT 1 FROM clients WHERE ruc = $1`;
  return consultarUno(sql, excluirId ? [ruc, excluirId] : [ruc]);
}

async function crearCliente(datos) {
  const { rows: [cliente] } = await pool.query(
    `INSERT INTO clients (nombre, razon_social, razon_comercial, ruc, nombre_contacto,
                          email_contacto, telefono, direccion, client_category_id,
                          segmentation_id, sector_id, activo)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     RETURNING id, nombre, ruc, activo, created_at`,
    [
      datos.nombre, datos.razon_social || null, datos.razon_comercial || null,
      datos.ruc, datos.nombre_contacto || null, datos.email_contacto || null,
      datos.telefono || null, datos.direccion || null,
      datos.categoria_usuario_id, datos.segmentacion_id, datos.sector_id || null,
      datos.activo !== false,
    ]
  );
  return cliente;
}

async function actualizarCliente(id, datos) {
  const campos = [];
  const params = [];
  let idx = 1;

  const mapeados = {
    nombre: datos.nombre,
    razon_social: datos.razon_social,
    razon_comercial: datos.razon_comercial,
    ruc: datos.ruc,
    nombre_contacto: datos.nombre_contacto,
    email_contacto: datos.email_contacto,
    telefono: datos.telefono,
    direccion: datos.direccion,
    client_category_id: datos.categoria_usuario_id,
    segmentation_id: datos.segmentacion_id,
    sector_id: datos.sector_id,
    activo: datos.activo,
  };

  for (const [campo, valor] of Object.entries(mapeados)) {
    if (valor !== undefined) {
      campos.push(`${campo} = $${idx++}`);
      params.push(valor);
    }
  }

  if (!campos.length) return buscarClientePorId(id);
  campos.push(`updated_at = NOW()`);
  params.push(id);

  const { rows: [cliente] } = await pool.query(
    `UPDATE clients SET ${campos.join(', ')} WHERE id = $${idx} RETURNING id, nombre, updated_at`,
    params
  );
  return cliente;
}

async function toggleActivo(id) {
  const { rows: [cliente] } = await pool.query(
    `UPDATE clients SET activo = NOT activo, updated_at = NOW() WHERE id = $1 RETURNING id, activo, updated_at`,
    [id]
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
