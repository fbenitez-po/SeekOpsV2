const { consultar, consultarUno, pool } = require('../config/database');

function construirFiltros(filtros) {
  const params = [];
  const condiciones = [];
  let idx = 1;

  if (filtros.activo !== undefined) {
    params.push(filtros.activo === 'true');
    condiciones.push(`u.activo = $${idx++}`);
  }
  if (filtros.search) {
    params.push(`%${filtros.search}%`);
    condiciones.push(`(u.nombres ILIKE $${idx} OR u.apellidos ILIKE $${idx} OR u.email ILIKE $${idx++})`);
  }
  if (filtros.equipo_id) {
    params.push(filtros.equipo_id);
    condiciones.push(`u.team_id = $${idx++}`);
  }


  return { params, condiciones };
}

async function listarUsuarios(filtros) {
  const { params, condiciones } = construirFiltros(filtros);
  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
  const limite = Math.min(parseInt(filtros.limit) || 20, 100);
  const offset = ((parseInt(filtros.page) || 1) - 1) * limite;

  const sql = `
    SELECT u.id, u.email, u.nombres, u.apellidos, u.numero_documento, u.puesto,
           u.celular, u.avatar_url, u.activo, u.staff, u.super_usuario,
           u.fecha_ingreso, u.created_at, u.updated_at,
           t.id as equipo_id, t.name as equipo_nombre,
           a.id as area_id, a.name as area_nombre
    FROM users u
    LEFT JOIN teams t ON t.id = u.team_id
    LEFT JOIN areas a ON a.id = u.area_id
    ${where}
    ORDER BY u.apellidos, u.nombres
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
    `SELECT ug.codigo FROM user_groups ug
     JOIN user_group_members ugm ON ugm.group_id = ug.id
     WHERE ugm.user_id = $1`,
    [usuarioId]
  );
  return filas.map((f) => f.codigo);
}

async function obtenerProyectosDeUsuario(usuarioId) {
  return consultar(
    `SELECT p.id, p.nombre, p.code as codigo, c.nombre as cliente, pu.rol, p.activo
     FROM projects p
     JOIN project_users pu ON pu.project_id = p.id
     JOIN clients c ON c.id = p.client_id
     WHERE pu.user_id = $1`,
    [usuarioId]
  );
}

async function buscarUsuarioPorId(id) {
  return consultarUno(
    `SELECT u.id, u.email, u.nombres, u.apellidos, u.numero_documento, u.puesto,
            u.celular, u.avatar_url, u.activo, u.staff, u.super_usuario,
            u.fecha_ingreso, u.created_at, u.updated_at, u.deactivated_at,
            t.id as equipo_id, t.name as equipo_nombre,
            a.id as area_id, a.name as area_nombre
     FROM users u
     LEFT JOIN teams t ON t.id = u.team_id
     LEFT JOIN areas a ON a.id = u.area_id
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
    ? `SELECT 1 FROM users WHERE numero_documento = $1 AND id != $2`
    : `SELECT 1 FROM users WHERE numero_documento = $1`;
  const params = excluirId ? [numero, excluirId] : [numero];
  return consultarUno(sql, params);
}

async function crearUsuario(datos) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: [usuario] } = await client.query(
      `INSERT INTO users (email, password_hash, nombres, apellidos, numero_documento, puesto,
                          celular, avatar_url, team_id, area_id, fecha_ingreso, activo, staff, super_usuario)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING id, email, nombres, apellidos, activo, created_at`,
      [
        datos.email,
        '$placeholder$', // se actualiza tras confirmar contraseña via reset
        datos.nombres, datos.apellidos, datos.numero_documento,
        datos.puesto, datos.celular || null, datos.avatar_url || null,
        datos.equipo_id, datos.area_id, datos.fecha_ingreso,
        datos.activo !== false, datos.staff || false, datos.super_usuario || false,
      ]
    );

    for (const grupoCodigo of (datos.grupos || [])) {
      await client.query(
        `INSERT INTO user_group_members (user_id, group_id)
         SELECT $1, id FROM user_groups WHERE codigo = $2 ON CONFLICT DO NOTHING`,
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
  const campos = [];
  const params = [];
  let idx = 1;

  const mapeados = {
    nombres: datos.nombres,
    apellidos: datos.apellidos,
    numero_documento: datos.numero_documento,
    puesto: datos.puesto,
    celular: datos.celular,
    avatar_url: datos.avatar_url,
    team_id: datos.equipo_id,
    area_id: datos.area_id,
    fecha_ingreso: datos.fecha_ingreso,
    activo: datos.activo,
    staff: datos.staff,
    super_usuario: datos.super_usuario,
  };

  for (const [campo, valor] of Object.entries(mapeados)) {
    if (valor !== undefined) {
      campos.push(`${campo} = $${idx++}`);
      params.push(valor);
    }
  }

  if (!campos.length) return buscarUsuarioPorId(id);

  campos.push(`updated_at = NOW()`);
  params.push(id);

  const { rows: [usuario] } = await pool.query(
    `UPDATE users SET ${campos.join(', ')} WHERE id = $${idx} RETURNING id, nombres, apellidos, updated_at`,
    params
  );

  if (datos.grupos) {
    await pool.query(`DELETE FROM user_group_members WHERE user_id = $1`, [id]);
    for (const grupoCodigo of datos.grupos) {
      await pool.query(
        `INSERT INTO user_group_members (user_id, group_id)
         SELECT $1, id FROM user_groups WHERE codigo = $2 ON CONFLICT DO NOTHING`,
        [id, grupoCodigo]
      );
    }
  }

  return usuario;
}

async function toggleActivo(id) {
  const { rows: [usuario] } = await pool.query(
    `UPDATE users
     SET activo = NOT activo,
         deactivated_at = CASE WHEN activo THEN NOW() ELSE NULL END,
         updated_at = NOW()
     WHERE id = $1
     RETURNING id, activo, deactivated_at`,
    [id]
  );
  return usuario;
}

module.exports = {
  listarUsuarios,
  obtenerGruposDeUsuario,
  obtenerProyectosDeUsuario,
  buscarUsuarioPorId,
  emailExiste,
  documentoExiste,
  crearUsuario,
  actualizarUsuario,
  toggleActivo,
};
