const { consultar, consultarUno, pool } = require('../config/database');

async function listarProyectos(filtros, usuarioId, roles) {
  const params = [];
  const condiciones = [];
  let idx = 1;

  if (!roles.includes('ADMIN')) {
    if (roles.includes('GESTOR')) {
      params.push(usuarioId);
      params.push(usuarioId);
      condiciones.push(`(EXISTS (SELECT 1 FROM project_user pu WHERE pu.project_id = p.id AND pu.user_id = $${idx++}) OR p.manager_id = $${idx++})`);
    } else {
      params.push(usuarioId);
      condiciones.push(`EXISTS (SELECT 1 FROM project_user pu WHERE pu.project_id = p.id AND pu.user_id = $${idx++})`);
    }
  }

  if (filtros.activo !== undefined) {
    params.push(filtros.activo === 'true');
    condiciones.push(`p.is_active = $${idx++}`);
  }
  if (filtros.cliente_id) {
    params.push(filtros.cliente_id);
    condiciones.push(`p.client_id = $${idx++}`);
  }
  if (filtros.gestor_id) {
    params.push(filtros.gestor_id);
    condiciones.push(`p.manager_id = $${idx++}`);
  }
  if (filtros.search) {
    params.push(`%${filtros.search}%`);
    condiciones.push(`(p.name ILIKE $${idx} OR p.code ILIKE $${idx++})`);
  }

  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
  const limite = Math.min(parseInt(filtros.limit) || 20, 100);
  const offset = ((parseInt(filtros.page) || 1) - 1) * limite;

  const sql = `
    SELECT p.id, p.code as codigo, p.name AS nombre, p.is_active as activo,
           p.start_date AS fecha_inicio, p.end_date AS fecha_fin,
           p.actual_start_date AS fecha_inicio_real, p.actual_end_date AS fecha_fin_real,
           c.id as cliente_id, COALESCE(c.trade_name, c.legal_name) as cliente_nombre,
           g.id as gestor_id, g.first_name as gestor_nombres, g.last_name as gestor_apellidos,
           s.id as seg_id, s.name as seg_nombre,
           (SELECT COALESCE(json_agg(json_build_object('id', pc.id, 'nombre', pc.name) ORDER BY pc.name), '[]'::json)
            FROM project_project_category ppc JOIN project_categories pc ON pc.id = ppc.project_category_id
            WHERE ppc.project_id = p.id) as categorias,
           ts.id as ts_id, ts.name as ts_nombre,
           a.id as area_id, a.name as area_nombre,
           (SELECT COUNT(*) FROM project_user pu WHERE pu.project_id = p.id) as usuarios_count
    FROM projects p
    JOIN clients c ON c.id = p.client_id
    JOIN users g ON g.id = p.manager_id
    LEFT JOIN project_segmentation s ON s.id = p.project_segmentation_id
    LEFT JOIN service_types ts ON ts.id = p.service_type_id
    LEFT JOIN areas a ON a.id = p.area_id
    ${where}
    ORDER BY p.name
    LIMIT $${params.length + 1} OFFSET $${params.length + 2}
  `;

  const [proyectos, [conteo]] = await Promise.all([
    consultar(sql, [...params, limite, offset]),
    consultar(
      `SELECT COUNT(DISTINCT p.id) as total FROM projects p JOIN clients c ON c.id = p.client_id JOIN users g ON g.id = p.manager_id ${where}`,
      params
    ),
  ]);

  return { proyectos, total: parseInt(conteo.total) };
}

async function buscarProyectoPorId(id) {
  return consultarUno(
    `SELECT p.id, p.code as codigo, p.name AS nombre, p.is_active as activo,
            p.start_date AS fecha_inicio, p.end_date AS fecha_fin,
            p.actual_start_date AS fecha_inicio_real, p.actual_end_date AS fecha_fin_real,
            p.created_at, p.updated_at,
            c.id as cliente_id, COALESCE(c.trade_name, c.legal_name) as cliente_nombre, c.ruc,
            g.id as gestor_id, g.first_name as gestor_nombres, g.last_name as gestor_apellidos,
            s.id as seg_id, s.name as seg_nombre,
            (SELECT COALESCE(json_agg(json_build_object('id', pc.id, 'nombre', pc.name) ORDER BY pc.name), '[]'::json)
             FROM project_project_category ppc JOIN project_categories pc ON pc.id = ppc.project_category_id
             WHERE ppc.project_id = p.id) as categorias,
            ts.id as ts_id, ts.name as ts_nombre,
            a.id as area_id, a.name as area_nombre
     FROM projects p
     JOIN clients c ON c.id = p.client_id
     JOIN users g ON g.id = p.manager_id
     LEFT JOIN project_segmentation s ON s.id = p.project_segmentation_id
     LEFT JOIN service_types ts ON ts.id = p.service_type_id
     LEFT JOIN areas a ON a.id = p.area_id
     WHERE p.id = $1`,
    [id]
  );
}

async function obtenerUsuariosDeProyecto(proyectoId) {
  return consultar(
    `SELECT u.id, u.first_name AS nombres, u.last_name AS apellidos, u.email, u.avatar_url, pu.role AS rol
     FROM users u JOIN project_user pu ON pu.user_id = u.id
     WHERE pu.project_id = $1 ORDER BY u.last_name`,
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
    `SELECT 1 FROM user_profile up
     JOIN profiles pr ON pr.id = up.profile_id
     WHERE up.user_id = $1 AND pr.code = 'GESTOR'`,
    [usuarioId]
  );
}

async function crearProyecto(datos, email) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: [proyecto] } = await client.query(
      `INSERT INTO projects (code, name, client_id, project_segmentation_id,
                             productivity_layer_id, service_type_id,
                             manager_id, area_id, start_date, end_date,
                             actual_start_date, actual_end_date, is_active,
                             created_by, updated_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$14)
       RETURNING id, code as codigo, name AS nombre, is_active as activo, created_at`,
      [
        datos.codigo, datos.nombre, datos.cliente_id,
        datos.segmentacion_id || null,
        datos.capa_productividad_id || null, datos.tipo_servicio_id || null,
        datos.gestor_id, datos.area_id || null,
        datos.fecha_inicio || null, datos.fecha_fin || null,
        datos.fecha_inicio_real || null, datos.fecha_fin_real || null,
        datos.activo !== false,
        email || null,
      ]
    );

    if (Array.isArray(datos.categorias_proyecto_ids) && datos.categorias_proyecto_ids.length) {
      for (const catId of datos.categorias_proyecto_ids) {
        await client.query(
          `INSERT INTO project_project_category (project_id, project_category_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
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

async function actualizarProyecto(id, datos, email) {
  const campos = [];
  const params = [];
  let idx = 1;

  const mapeados = {
    code: datos.codigo,
    name: datos.nombre,
    client_id: datos.cliente_id,
    project_segmentation_id: datos.segmentacion_id,
    productivity_layer_id: datos.capa_productividad_id,
    service_type_id: datos.tipo_servicio_id,
    manager_id: datos.gestor_id,
    area_id: datos.area_id !== undefined ? (datos.area_id || null) : undefined,
    start_date: datos.fecha_inicio,
    end_date: datos.fecha_fin,
    actual_start_date: datos.fecha_inicio_real,
    actual_end_date: datos.fecha_fin_real,
    is_active: datos.activo,
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
      campos.push(`updated_at = NOW()`, `updated_by = $${idx++}`);
      params.push(email || null, id);
      await client.query(
        `UPDATE projects SET ${campos.join(', ')} WHERE id = $${idx}`,
        params
      );
    }

    if (datos.categorias_proyecto_ids !== undefined) {
      await client.query(`DELETE FROM project_project_category WHERE project_id = $1`, [id]);
      if (Array.isArray(datos.categorias_proyecto_ids) && datos.categorias_proyecto_ids.length) {
        for (const catId of datos.categorias_proyecto_ids) {
          await client.query(
            `INSERT INTO project_project_category (project_id, project_category_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
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

async function toggleActivo(id, email) {
  const { rows: [proyecto] } = await pool.query(
    `UPDATE projects
     SET is_active = NOT is_active,
         deleted_at = CASE WHEN is_active THEN NOW() ELSE NULL END,
         deleted_by = CASE WHEN is_active THEN $2 ELSE NULL END,
         updated_at = NOW(),
         updated_by = $2
     WHERE id = $1
     RETURNING id, is_active as activo, updated_at`,
    [id, email || null]
  );
  return proyecto;
}

async function asignarUsuarios(proyectoId, usuarios) {
  const asignados = [];
  const yaExistian = [];

  for (const { usuario_id, rol } of usuarios) {
    const existente = await consultarUno(
      `SELECT 1 FROM project_user WHERE project_id = $1 AND user_id = $2 AND role = $3`,
      [proyectoId, usuario_id, rol]
    );

    if (existente) {
      yaExistian.push({ usuario_id, rol });
    } else {
      await pool.query(
        `INSERT INTO project_user (project_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
        [proyectoId, usuario_id, rol]
      );
      asignados.push({ usuario_id, rol });
    }
  }

  return { usuarios_asignados: asignados, ya_existian: yaExistian };
}

async function desasignarUsuario(proyectoId, usuarioId) {
  const existente = await consultarUno(
    `SELECT 1 FROM project_user WHERE project_id = $1 AND user_id = $2`,
    [proyectoId, usuarioId]
  );
  if (!existente) return false;

  await pool.query(
    `DELETE FROM project_user WHERE project_id = $1 AND user_id = $2`,
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
