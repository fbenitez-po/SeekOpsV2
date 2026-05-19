const { consultar, consultarUno, pool } = require('../config/database');

function construirFiltros(filtros) {
  const params = [];
  const condiciones = [];
  let idx = 1;

  if (filtros.activo !== undefined) {
    params.push(filtros.activo === 'true');
    condiciones.push(`u.is_active = $${idx++}`);
  }
  if (filtros.search) {
    params.push(`%${filtros.search}%`);
    condiciones.push(`(u.first_name ILIKE $${idx} OR u.last_name ILIKE $${idx} OR u.email ILIKE $${idx++})`);
  }
  if (filtros.equipo_id) {
    params.push(filtros.equipo_id);
    condiciones.push(`u.team_id = $${idx++}`);
  }
  if (filtros.grupo) {
    params.push(filtros.grupo);
    condiciones.push(`u.id IN (SELECT up.user_id FROM user_profile up JOIN profiles pr ON pr.id = up.profile_id WHERE pr.code = $${idx++})`);
  }

  return { params, condiciones };
}

async function listarUsuarios(filtros) {
  const { params, condiciones } = construirFiltros(filtros);
  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
  const limite = Math.min(parseInt(filtros.limit) || 20, 100);
  const offset = ((parseInt(filtros.page) || 1) - 1) * limite;

  const sql = `
    SELECT u.id, u.email, u.first_name AS nombres, u.last_name AS apellidos,
           u.document_number AS numero_documento, u.position AS puesto,
           u.mobile_phone AS celular, u.avatar_url, u.is_active as activo,
           u.is_staff AS staff, u.is_superuser AS super_usuario,
           u.hire_date AS fecha_ingreso, u.created_at, u.updated_at,
           t.id as equipo_id, t.name as equipo_nombre,
           (
             SELECT JSON_AGG(json_build_object('id', a.id, 'nombre', a.name) ORDER BY a.name)
             FROM user_area ua JOIN areas a ON a.id = ua.area_id
             WHERE ua.user_id = u.id
           ) as areas
    FROM users u
    LEFT JOIN teams t ON t.id = u.team_id
    ${where}
    ORDER BY u.last_name, u.first_name
    LIMIT $${params.length + 1} OFFSET $${params.length + 2}
  `;

  const conteoSql = `SELECT COUNT(*) as total FROM users u ${where}`;

  const [usuarios, [conteo]] = await Promise.all([
    consultar(sql, [...params, limite, offset]),
    consultar(conteoSql, params),
  ]);

  return { usuarios, total: parseInt(conteo.total) };
}

async function obtenerGruposDeUsuario(usuarioId) {
  const filas = await consultar(
    `SELECT pr.code AS codigo FROM profiles pr
     JOIN user_profile up ON up.profile_id = pr.id
     WHERE up.user_id = $1`,
    [usuarioId]
  );
  return filas.map((f) => f.codigo);
}

async function obtenerAreasDeUsuario(usuarioId) {
  return consultar(
    `SELECT a.id, a.name as nombre
     FROM areas a JOIN user_area ua ON ua.area_id = a.id
     WHERE ua.user_id = $1
     ORDER BY a.name`,
    [usuarioId]
  );
}

async function obtenerProyectosDeUsuario(usuarioId) {
  return consultar(
    `SELECT p.id, p.name AS nombre, p.code as codigo, COALESCE(c.trade_name, c.legal_name) as cliente, pu.role AS rol, p.is_active as activo
     FROM projects p
     JOIN project_user pu ON pu.project_id = p.id
     JOIN clients c ON c.id = p.client_id
     WHERE pu.user_id = $1`,
    [usuarioId]
  );
}

async function buscarUsuarioPorId(id) {
  return consultarUno(
    `SELECT u.id, u.email, u.first_name AS nombres, u.last_name AS apellidos,
            u.document_number AS numero_documento, u.position AS puesto,
            u.mobile_phone AS celular, u.avatar_url, u.is_active as activo,
            u.is_staff AS staff, u.is_superuser AS super_usuario,
            u.hire_date AS fecha_ingreso, u.created_at, u.updated_at, u.deleted_at,
            t.id as equipo_id, t.name as equipo_nombre
     FROM users u
     LEFT JOIN teams t ON t.id = u.team_id
     WHERE u.id = $1`,
    [id]
  );
}

async function emailExiste(email, excluirId = null) {
  const sql = excluirId
    ? `SELECT 1 FROM users WHERE email = $1 AND id != $2`
    : `SELECT 1 FROM users WHERE email = $1`;
  const params = excluirId ? [email, excluirId] : [email];
  return consultarUno(sql, params);
}

async function documentoExiste(numero, excluirId = null) {
  const sql = excluirId
    ? `SELECT 1 FROM users WHERE document_number = $1 AND id != $2`
    : `SELECT 1 FROM users WHERE document_number = $1`;
  const params = excluirId ? [numero, excluirId] : [numero];
  return consultarUno(sql, params);
}

async function crearUsuario(datos) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: [usuario] } = await client.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, document_number, position,
                          mobile_phone, avatar_url, team_id, hire_date, is_active, is_staff, is_superuser)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING id, email, first_name AS nombres, last_name AS apellidos, is_active as activo, created_at`,
      [
        datos.email,
        '$placeholder$',
        datos.nombres, datos.apellidos, datos.numero_documento,
        datos.puesto, datos.celular || null, datos.avatar_url || null,
        datos.equipo_id, datos.fecha_ingreso,
        datos.activo !== false, datos.staff || false, datos.super_usuario || false,
      ]
    );

    for (const areaId of (datos.areas || [])) {
      await client.query(
        `INSERT INTO user_area (user_id, area_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [usuario.id, areaId]
      );
    }

    for (const grupoCodigo of (datos.grupos || [])) {
      await client.query(
        `INSERT INTO user_profile (user_id, profile_id)
         SELECT $1, id FROM profiles WHERE code = $2 ON CONFLICT DO NOTHING`,
        [usuario.id, grupoCodigo]
      );
    }

    await client.query('COMMIT');
    return usuario;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function actualizarUsuario(id, datos) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const campos = [];
    const params = [];
    let idx = 1;

    const mapeados = {
      first_name: datos.nombres,
      last_name: datos.apellidos,
      document_number: datos.numero_documento,
      position: datos.puesto,
      mobile_phone: datos.celular,
      avatar_url: datos.avatar_url,
      team_id: datos.equipo_id,
      hire_date: datos.fecha_ingreso,
      is_active: datos.activo,
      is_staff: datos.staff,
      is_superuser: datos.super_usuario,
    };

    for (const [campo, valor] of Object.entries(mapeados)) {
      if (valor !== undefined) {
        campos.push(`${campo} = $${idx++}`);
        params.push(valor);
      }
    }

    if (campos.length) {
      campos.push(`updated_at = NOW()`);
      params.push(id);
      await client.query(
        `UPDATE users SET ${campos.join(', ')} WHERE id = $${idx}`,
        params
      );
    }

    if (datos.areas) {
      await client.query(`DELETE FROM user_area WHERE user_id = $1`, [id]);
      for (const areaId of datos.areas) {
        await client.query(
          `INSERT INTO user_area (user_id, area_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [id, areaId]
        );
      }
    }

    if (datos.grupos) {
      await client.query(`DELETE FROM user_profile WHERE user_id = $1`, [id]);
      for (const grupoCodigo of datos.grupos) {
        await client.query(
          `INSERT INTO user_profile (user_id, profile_id)
           SELECT $1, id FROM profiles WHERE code = $2 ON CONFLICT DO NOTHING`,
          [id, grupoCodigo]
        );
      }
    }

    await client.query('COMMIT');
    return buscarUsuarioPorId(id);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function toggleActivo(id, email) {
  const { rows: [usuario] } = await pool.query(
    `UPDATE users
     SET is_active = NOT is_active,
         deleted_at = CASE WHEN is_active THEN NOW() ELSE NULL END,
         deleted_by = CASE WHEN is_active THEN $2 ELSE NULL END,
         updated_at = NOW(),
         updated_by = $2
     WHERE id = $1
     RETURNING id, is_active as activo, deleted_at`,
    [id, email || null]
  );
  return usuario;
}

module.exports = {
  listarUsuarios,
  obtenerGruposDeUsuario,
  obtenerAreasDeUsuario,
  obtenerProyectosDeUsuario,
  buscarUsuarioPorId,
  emailExiste,
  documentoExiste,
  crearUsuario,
  actualizarUsuario,
  toggleActivo,
};
