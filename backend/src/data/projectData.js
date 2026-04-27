const { consultar, consultarUno, pool } = require('../config/database');

async function listarProyectos(filtros, usuarioId, roles) {
  const params = [];
  const condiciones = [];
  let idx = 1;

  if (!roles.includes('ADMIN')) {
    if (roles.includes('GESTOR')) {
      params.push(usuarioId);
      params.push(usuarioId);
      condiciones.push(`(EXISTS (SELECT 1 FROM project_users pu WHERE pu.project_id = p.id AND pu.user_id = $${idx++}) OR p.gestor_id = $${idx++})`);
    } else {
      params.push(usuarioId);
      condiciones.push(`EXISTS (SELECT 1 FROM project_users pu WHERE pu.project_id = p.id AND pu.user_id = $${idx++})`);
    }
  }

  if (filtros.activo !== undefined) {
    params.push(filtros.activo === 'true');
    condiciones.push(`p.activo = $${idx++}`);
  }
  if (filtros.cliente_id) {
    params.push(filtros.cliente_id);
    condiciones.push(`p.client_id = $${idx++}`);
  }
  if (filtros.gestor_id) {
    params.push(filtros.gestor_id);
    condiciones.push(`p.gestor_id = $${idx++}`);
  }
  if (filtros.search) {
    params.push(`%${filtros.search}%`);
    condiciones.push(`(p.nombre ILIKE $${idx} OR p.code ILIKE $${idx++})`);
  }

  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
  const limite = Math.min(parseInt(filtros.limit) || 20, 100);
  const offset = ((parseInt(filtros.page) || 1) - 1) * limite;

  const sql = `
    SELECT p.id, p.code as codigo, p.nombre, p.descripcion, p.activo,
           p.fecha_inicio, p.fecha_fin,
           c.id as cliente_id, c.nombre as cliente_nombre,
           g.id as gestor_id, g.nombres as gestor_nombres, g.apellidos as gestor_apellidos,
           s.id as seg_id, s.nombre as seg_nombre,
           ic.id as cat_id, ic.name as cat_nombre,
           ts.id as ts_id, ts.nombre as ts_nombre,
           (SELECT COUNT(*) FROM project_users pu WHERE pu.project_id = p.id) as usuarios_count
    FROM projects p
    JOIN clients c ON c.id = p.client_id
    JOIN users g ON g.id = p.gestor_id
    LEFT JOIN segmentations s ON s.id = p.segmentation_id
    LEFT JOIN income_categories ic ON ic.id = p.income_category_id
    LEFT JOIN service_types ts ON ts.id = p.service_type_id
    ${where}
    ORDER BY p.nombre
    LIMIT $${params.length + 1} OFFSET $${params.length + 2}
  `;

  const [proyectos, [conteo]] = await Promise.all([
    consultar(sql, [...params, limite, offset]),
    consultar(
      `SELECT COUNT(DISTINCT p.id) as total FROM projects p JOIN clients c ON c.id = p.client_id JOIN users g ON g.id = p.gestor_id ${where}`,
      params
    ),
  ]);

  return { proyectos, total: parseInt(conteo.total) };
}

async function buscarProyectoPorId(id) {
  return consultarUno(
    `SELECT p.id, p.code as codigo, p.nombre, p.descripcion, p.activo,
            p.fecha_inicio, p.fecha_fin, p.created_at, p.updated_at,
            c.id as cliente_id, c.nombre as cliente_nombre, c.ruc,
            g.id as gestor_id, g.nombres as gestor_nombres, g.apellidos as gestor_apellidos,
            s.id as seg_id, s.nombre as seg_nombre,
            ic.id as cat_id, ic.name as cat_nombre,
            ts.id as ts_id, ts.nombre as ts_nombre
     FROM projects p
     JOIN clients c ON c.id = p.client_id
     JOIN users g ON g.id = p.gestor_id
     LEFT JOIN segmentations s ON s.id = p.segmentation_id
     LEFT JOIN income_categories ic ON ic.id = p.income_category_id
     LEFT JOIN service_types ts ON ts.id = p.service_type_id
     WHERE p.id = $1`,
    [id]
  );
}

async function obtenerUsuariosDeProyecto(proyectoId) {
  return consultar(
    `SELECT u.id, u.nombres, u.apellidos, u.email, u.avatar_url, pu.rol
     FROM users u JOIN project_users pu ON pu.user_id = u.id
     WHERE pu.project_id = $1 ORDER BY u.apellidos`,
    [proyectoId]
  );
}

async function codigoExiste(codigo, excluirId = null) {
  const sql = excluirId
    ? `SELECT 1 FROM projects WHERE code = $1 AND id != $2`
    : `SELECT 1 FROM projects WHERE code = $1`;
  return consultarUno(sql, excluirId ? [codigo, excluirId] : [codigo]);
}

async function usuarioTieneRolGestor(usuarioId) {
  return consultarUno(
    `SELECT 1 FROM user_group_members ugm
     JOIN user_groups ug ON ug.id = ugm.group_id
     WHERE ugm.user_id = $1 AND ug.codigo = 'GESTOR'`,
    [usuarioId]
  );
}

async function crearProyecto(datos) {
  const { rows: [proyecto] } = await pool.query(
    `INSERT INTO projects (code, nombre, client_id, descripcion, segmentation_id,
                           income_category_id, productivity_layer_id, service_type_id,
                           gestor_id, fecha_inicio, fecha_fin, activo)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     RETURNING id, code as codigo, nombre, activo, created_at`,
    [
      datos.codigo, datos.nombre, datos.cliente_id, datos.descripcion || null,
      datos.segmentacion_id, datos.categoria_ingreso_id,
      datos.capa_productividad_id || null, datos.tipo_servicio_id || null,
      datos.gestor_id, datos.fecha_inicio || null, datos.fecha_fin || null,
      datos.activo !== false,
    ]
  );
  return proyecto;
}

async function actualizarProyecto(id, datos) {
  const campos = [];
  const params = [];
  let idx = 1;

  const mapeados = {
    code: datos.codigo,
    nombre: datos.nombre,
    client_id: datos.cliente_id,
    descripcion: datos.descripcion,
    segmentation_id: datos.segmentacion_id,
    income_category_id: datos.categoria_ingreso_id,
    productivity_layer_id: datos.capa_productividad_id,
    service_type_id: datos.tipo_servicio_id,
    gestor_id: datos.gestor_id,
    fecha_inicio: datos.fecha_inicio,
    fecha_fin: datos.fecha_fin,
    activo: datos.activo,
  };

  for (const [campo, valor] of Object.entries(mapeados)) {
    if (valor !== undefined) {
      campos.push(`${campo} = $${idx++}`);
      params.push(valor);
    }
  }

  if (!campos.length) return buscarProyectoPorId(id);
  campos.push(`updated_at = NOW()`);
  params.push(id);

  const { rows: [proyecto] } = await pool.query(
    `UPDATE projects SET ${campos.join(', ')} WHERE id = $${idx} RETURNING id, nombre, updated_at`,
    params
  );
  return proyecto;
}

async function toggleActivo(id) {
  const { rows: [proyecto] } = await pool.query(
    `UPDATE projects SET activo = NOT activo, updated_at = NOW() WHERE id = $1 RETURNING id, activo, updated_at`,
    [id]
  );
  return proyecto;
}

async function asignarUsuarios(proyectoId, usuarios) {
  const asignados = [];
  const yaExistian = [];

  for (const { usuario_id, rol } of usuarios) {
    const existente = await consultarUno(
      `SELECT 1 FROM project_users WHERE project_id = $1 AND user_id = $2 AND rol = $3`,
      [proyectoId, usuario_id, rol]
    );

    if (existente) {
      yaExistian.push({ usuario_id, rol });
    } else {
      await pool.query(
        `INSERT INTO project_users (project_id, user_id, rol) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
        [proyectoId, usuario_id, rol]
      );
      asignados.push({ usuario_id, rol });
    }
  }

  return { usuarios_asignados: asignados, ya_existian: yaExistian };
}

async function desasignarUsuario(proyectoId, usuarioId) {
  const existente = await consultarUno(
    `SELECT 1 FROM project_users WHERE project_id = $1 AND user_id = $2`,
    [proyectoId, usuarioId]
  );
  if (!existente) return false;

  await pool.query(
    `DELETE FROM project_users WHERE project_id = $1 AND user_id = $2`,
    [proyectoId, usuarioId]
  );
  return true;
}

module.exports = {
  listarProyectos,
  buscarProyectoPorId,
  obtenerUsuariosDeProyecto,
  codigoExiste,
  usuarioTieneRolGestor,
  crearProyecto,
  actualizarProyecto,
  toggleActivo,
  asignarUsuarios,
  desasignarUsuario,
};
