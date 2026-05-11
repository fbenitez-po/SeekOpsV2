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
    SELECT p.id, p.code as codigo, p.nombre, p.activo,
           p.fecha_inicio, p.fecha_fin, p.fecha_inicio_real, p.fecha_fin_real,
           c.id as cliente_id, COALESCE(c.razon_comercial, c.razon_social) as cliente_nombre,
           g.id as gestor_id, g.nombres as gestor_nombres, g.apellidos as gestor_apellidos,
           s.id as seg_id, s.nombre as seg_nombre,
           (SELECT COALESCE(json_agg(json_build_object('id', pc.id, 'nombre', pc.nombre) ORDER BY pc.nombre), '[]'::json)
            FROM project_project_categories ppc JOIN project_categories pc ON pc.id = ppc.project_category_id
            WHERE ppc.project_id = p.id) as categorias,
           ts.id as ts_id, ts.nombre as ts_nombre,
           a.id as area_id, a.name as area_nombre,
           (SELECT COUNT(*) FROM project_users pu WHERE pu.project_id = p.id) as usuarios_count
    FROM projects p
    JOIN clients c ON c.id = p.client_id
    JOIN users g ON g.id = p.gestor_id
    LEFT JOIN project_segmentation s ON s.id = p.project_segmentation_id
    LEFT JOIN service_types ts ON ts.id = p.service_type_id
    LEFT JOIN areas a ON a.id = p.area_id
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
    `SELECT p.id, p.code as codigo, p.nombre, p.activo,
            p.fecha_inicio, p.fecha_fin, p.fecha_inicio_real, p.fecha_fin_real, p.created_at, p.updated_at,
            c.id as cliente_id, COALESCE(c.razon_comercial, c.razon_social) as cliente_nombre, c.ruc,
            g.id as gestor_id, g.nombres as gestor_nombres, g.apellidos as gestor_apellidos,
            s.id as seg_id, s.nombre as seg_nombre,
            (SELECT COALESCE(json_agg(json_build_object('id', pc.id, 'nombre', pc.nombre) ORDER BY pc.nombre), '[]'::json)
             FROM project_project_categories ppc JOIN project_categories pc ON pc.id = ppc.project_category_id
             WHERE ppc.project_id = p.id) as categorias,
            ts.id as ts_id, ts.nombre as ts_nombre,
            a.id as area_id, a.name as area_nombre
     FROM projects p
     JOIN clients c ON c.id = p.client_id
     JOIN users g ON g.id = p.gestor_id
     LEFT JOIN project_segmentation s ON s.id = p.project_segmentation_id
     LEFT JOIN service_types ts ON ts.id = p.service_type_id
     LEFT JOIN areas a ON a.id = p.area_id
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
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: [proyecto] } = await client.query(
      `INSERT INTO projects (code, nombre, client_id, project_segmentation_id,
                             productivity_layer_id, service_type_id,
                             gestor_id, area_id, fecha_inicio, fecha_fin,
                             fecha_inicio_real, fecha_fin_real, activo)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING id, code as codigo, nombre, activo, created_at`,
      [
        datos.codigo, datos.nombre, datos.cliente_id,
        datos.segmentacion_id || null,
        datos.capa_productividad_id || null, datos.tipo_servicio_id || null,
        datos.gestor_id, datos.area_id || null,
        datos.fecha_inicio || null, datos.fecha_fin || null,
        datos.fecha_inicio_real || null, datos.fecha_fin_real || null,
        datos.activo !== false,
      ]
    );

    if (Array.isArray(datos.categorias_proyecto_ids) && datos.categorias_proyecto_ids.length) {
      for (const catId of datos.categorias_proyecto_ids) {
        await client.query(
          `INSERT INTO project_project_categories (project_id, project_category_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [proyecto.id, catId]
        );
      }
    }

    await client.query('COMMIT');
    return proyecto;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function actualizarProyecto(id, datos) {
  const campos = [];
  const params = [];
  let idx = 1;

  const mapeados = {
    code: datos.codigo,
    nombre: datos.nombre,
    client_id: datos.cliente_id,
    project_segmentation_id: datos.segmentacion_id,
    productivity_layer_id: datos.capa_productividad_id,
    service_type_id: datos.tipo_servicio_id,
    gestor_id: datos.gestor_id,
    area_id: datos.area_id !== undefined ? (datos.area_id || null) : undefined,
    fecha_inicio: datos.fecha_inicio,
    fecha_fin: datos.fecha_fin,
    fecha_inicio_real: datos.fecha_inicio_real,
    fecha_fin_real: datos.fecha_fin_real,
    activo: datos.activo,
  };

  for (const [campo, valor] of Object.entries(mapeados)) {
    if (valor !== undefined) {
      campos.push(`${campo} = $${idx++}`);
      params.push(valor);
    }
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (campos.length) {
      campos.push(`updated_at = NOW()`);
      params.push(id);
      await client.query(
        `UPDATE projects SET ${campos.join(', ')} WHERE id = $${idx}`,
        params
      );
    }

    if (datos.categorias_proyecto_ids !== undefined) {
      await client.query(`DELETE FROM project_project_categories WHERE project_id = $1`, [id]);
      if (Array.isArray(datos.categorias_proyecto_ids) && datos.categorias_proyecto_ids.length) {
        for (const catId of datos.categorias_proyecto_ids) {
          await client.query(
            `INSERT INTO project_project_categories (project_id, project_category_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [id, catId]
          );
        }
      }
    }

    await client.query('COMMIT');
    return buscarProyectoPorId(id);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
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
