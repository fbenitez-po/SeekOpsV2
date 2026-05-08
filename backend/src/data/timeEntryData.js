const { consultar, consultarUno, pool } = require('../config/database');

async function listarEntradas({ usuarioId, roles, proyectosIds, filtros }) {
  const params = [];
  const condiciones = [];
  let idx = 1;

  if (roles.includes('ADMIN')) {
    // sin restricción de usuario
  } else if (roles.includes('GESTOR')) {
    // entradas de proyectos donde es gestor
    params.push(usuarioId);
    condiciones.push(`(te.user_id = $${idx++} OR p.gestor_id = $${idx - 1})`);
  } else {
    params.push(usuarioId);
    condiciones.push(`te.user_id = $${idx++}`);
  }

  if (filtros.estado) {
    params.push(filtros.estado);
    condiciones.push(`te.estado = $${idx++}`);
  }

  if (filtros.semana) {
    params.push(filtros.semana);
    condiciones.push(`te.semana = $${idx++}`);
  }

  if (filtros.usuario_id && roles.includes('ADMIN')) {
    params.push(filtros.usuario_id);
    condiciones.push(`te.usuario_id = $${idx++}`);
  }

  if (filtros.proyecto_id) {
    params.push(filtros.proyecto_id);
    condiciones.push(`EXISTS (SELECT 1 FROM time_entry_lines tel2 WHERE tel2.time_entry_id = te.id AND tel2.project_id = $${idx++})`);
  }

  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
  const limite = Math.min(parseInt(filtros.limit) || 20, 100);
  const offset = ((parseInt(filtros.page) || 1) - 1) * limite;

  params.push(limite, offset);
  const sql = `
    SELECT te.id, te.semana, te.estado, te.created_at as fecha_carga,
           u.id as usuario_id, u.nombres, u.apellidos
    FROM time_entries te
    JOIN users u ON u.id = te.user_id
    LEFT JOIN time_entry_lines tel ON tel.time_entry_id = te.id
    LEFT JOIN projects p ON p.id = tel.project_id
    ${where}
    GROUP BY te.id, u.id
    ORDER BY te.created_at DESC
    LIMIT $${idx++} OFFSET $${idx++}
  `;

  const conteoSql = `
    SELECT COUNT(DISTINCT te.id) as total
    FROM time_entries te
    JOIN users u ON u.id = te.user_id
    LEFT JOIN time_entry_lines tel ON tel.time_entry_id = te.id
    LEFT JOIN projects p ON p.id = tel.project_id
    ${where}
  `;

  const [entradas, [conteo]] = await Promise.all([
    consultar(sql, params),
    consultar(conteoSql, params.slice(0, -2)),
  ]);

  return { entradas, total: parseInt(conteo.total) };
}

async function obtenerLineasDeEntrada(entradaId) {
  return consultar(
    `SELECT tel.id, tel.project_id, tel.income_category_id as categoria_ingreso_id,
            tel.hours as horas, tel.extra_hours as horas_extra, tel.comment as comentario,
            p.nombre as proyecto_nombre, p.code as proyecto_codigo,
            ic.name as categoria_nombre
     FROM time_entry_lines tel
     JOIN projects p ON p.id = tel.project_id
     LEFT JOIN income_categories ic ON ic.id = tel.income_category_id
     WHERE tel.time_entry_id = $1`,
    [entradaId]
  );
}

async function obtenerAprobacionesDeEntrada(entradaId) {
  return consultar(
    `SELECT tea.id, tea.action as accion, tea.comment as comentario,
            tea.suggested_hours as sugerencia_horas, tea.suggested_extra_hours as sugerencia_extras,
            tea.rejection_reason as razon_rechazo, tea.allow_resubmit as permitir_reenvio,
            tea.created_at as fecha,
            u.id as realizado_por_id, u.nombres, u.apellidos
     FROM time_entry_approvals tea
     JOIN users u ON u.id = tea.created_by_user_id
     WHERE tea.time_entry_id = $1
     ORDER BY tea.created_at ASC`,
    [entradaId]
  );
}

async function buscarEntradaPorId(id) {
  return consultarUno(
    `SELECT te.id, te.semana, te.estado, te.user_id,
            te.created_at as fecha_carga, te.updated_at as actualizado_en,
            u.nombres, u.apellidos
     FROM time_entries te JOIN users u ON u.id = te.user_id
     WHERE te.id = $1`,
    [id]
  );
}

async function verificarProyectoAsignado(usuarioId, proyectoId) {
  return consultarUno(
    `SELECT 1 FROM project_users WHERE user_id = $1 AND project_id = $2
     UNION
     SELECT 1 FROM projects WHERE id = $2 AND gestor_id = $1`,
    [usuarioId, proyectoId]
  );
}

async function verificarEntradaExistente(usuarioId, semana) {
  return consultarUno(
    `SELECT id FROM time_entries WHERE user_id = $1 AND semana = $2 AND estado IN ('PENDIENTE','APROBADO')`,
    [usuarioId, semana]
  );
}

async function esGestorDelProyecto(usuarioId, proyectoId) {
  return consultarUno(
    `SELECT 1 FROM projects WHERE id = $1 AND gestor_id = $2`,
    [proyectoId, usuarioId]
  );
}

async function obtenerProyectoDeEntrada(entradaId) {
  return consultarUno(
    `SELECT tel.project_id FROM time_entry_lines tel WHERE tel.time_entry_id = $1 LIMIT 1`,
    [entradaId]
  );
}

async function crearEntrada({ usuarioId, semana, estado, lineas }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: [entrada] } = await client.query(
      `INSERT INTO time_entries (user_id, semana, estado, created_by_user_id, updated_by_user_id)
       VALUES ($1, $2, $3, $1, $1) RETURNING id, semana, estado, created_at`,
      [usuarioId, semana, estado]
    );

    const lineasCreadas = [];
    for (const linea of lineas) {
      const { rows: [lineaCreada] } = await client.query(
        `INSERT INTO time_entry_lines (time_entry_id, project_id, income_category_id, hours, extra_hours, comment)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, project_id, income_category_id, hours, extra_hours, comment`,
        [entrada.id, linea.proyecto_id, linea.categoria_ingreso_id || null, linea.horas, linea.horas_extra || 0, linea.comentario || '']
      );
      lineasCreadas.push(lineaCreada);
    }

    await client.query('COMMIT');
    return { ...entrada, lineas: lineasCreadas };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function actualizarSoloHorasLineas(client, entradaId, lineas) {
  for (const linea of lineas) {
    await client.query(
      `UPDATE time_entry_lines SET hours = $1, extra_hours = $2 WHERE id = $3 AND time_entry_id = $4`,
      [linea.horas, linea.horas_extra ?? 0, linea.id, entradaId]
    );
  }
}

async function actualizarLineasEntrada(entradaId, lineas, usuarioId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const linea of lineas) {
      await client.query(
        `UPDATE time_entry_lines
         SET hours = $1, extra_hours = $2, comment = $3
         WHERE id = $4 AND time_entry_id = $5`,
        [linea.horas, linea.horas_extra ?? 0, linea.comentario ?? '', linea.id, entradaId]
      );
    }

    const { rows: [entrada] } = await client.query(
      `UPDATE time_entries SET estado = 'PENDIENTE', updated_at = NOW(), updated_by_user_id = $1
       WHERE id = $2 RETURNING id, semana, estado, updated_at`,
      [usuarioId, entradaId]
    );

    await client.query('COMMIT');
    return entrada;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function registrarAprobacion({ entradaId, accion, usuarioId, datos = {} }) {
  const estadoMap = { APROBAR: 'APROBADO', APROBAR_CON_OBSERVACION: 'APROBADO_CON_OBSERVACION', RECHAZAR: 'RECHAZADO' };
  const nuevoEstado = estadoMap[accion];

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (accion === 'APROBAR_CON_OBSERVACION' && datos.lineas?.length) {
      await actualizarSoloHorasLineas(client, entradaId, datos.lineas);
    }

    await client.query(
      `UPDATE time_entries SET estado = $1, updated_at = NOW(), updated_by_user_id = $2 WHERE id = $3`,
      [nuevoEstado, usuarioId, entradaId]
    );

    await client.query(
      `INSERT INTO time_entry_approvals
       (time_entry_id, action, comment, suggested_hours, suggested_extra_hours,
        rejection_reason, allow_resubmit, created_by_user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        entradaId, nuevoEstado,
        datos.comentario_observacion || datos.razon_rechazo || null,
        datos.sugerencia_horas || null,
        datos.sugerencia_extras || null,
        datos.razon_rechazo || null,
        datos.permitir_reenvio ?? false,
        usuarioId,
      ]
    );

    await client.query('COMMIT');
    return nuevoEstado;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function obtenerFechaIngreso(usuarioId) {
  return consultarUno('SELECT fecha_ingreso FROM users WHERE id = $1', [usuarioId]);
}

async function listarSemanasConCarga(usuarioId) {
  return consultar('SELECT DISTINCT semana FROM time_entries WHERE user_id = $1', [usuarioId]);
}

async function obtenerDatosSeekersSinCarga(gestorId) {
  return consultar(
    `SELECT
       u.id as user_id,
       u.nombres,
       u.apellidos,
       u.email,
       u.fecha_ingreso,
       COALESCE(
         json_agg(
           json_build_object(
             'semana', te.semana,
             'en_mis_proyectos', EXISTS(
               SELECT 1 FROM time_entry_lines tel
               JOIN projects p2 ON p2.id = tel.project_id
               WHERE tel.time_entry_id = te.id AND p2.gestor_id = $1
             )
           )
         ) FILTER (WHERE te.id IS NOT NULL),
         '[]'::json
       ) as entradas
     FROM (
       SELECT DISTINCT pu.user_id
       FROM projects p
       JOIN project_users pu ON pu.project_id = p.id
       WHERE p.gestor_id = $1 AND pu.activo = true AND pu.rol = 'SEEKER'
     ) seekers
     JOIN users u ON u.id = seekers.user_id AND u.id != $1
     LEFT JOIN time_entries te ON te.user_id = u.id AND te.estado != 'RECHAZADO'
     GROUP BY u.id, u.nombres, u.apellidos, u.email, u.fecha_ingreso`,
    [gestorId]
  );
}

async function verificarSeekerDeGestor(gestorId, seekerId) {
  return consultarUno(
    `SELECT u.nombres, u.apellidos, u.email,
            g.nombres as gestor_nombres, g.apellidos as gestor_apellidos
     FROM projects p
     JOIN project_users pu ON pu.project_id = p.id
     JOIN users u ON u.id = pu.user_id
     JOIN users g ON g.id = $1
     WHERE p.gestor_id = $1 AND pu.user_id = $2 AND pu.activo = true AND pu.rol = 'SEEKER'
     LIMIT 1`,
    [gestorId, seekerId]
  );
}

module.exports = {
  listarEntradas,
  buscarEntradaPorId,
  obtenerLineasDeEntrada,
  obtenerAprobacionesDeEntrada,
  verificarProyectoAsignado,
  verificarEntradaExistente,
  esGestorDelProyecto,
  obtenerProyectoDeEntrada,
  crearEntrada,
  actualizarLineasEntrada,
  registrarAprobacion,
  obtenerFechaIngreso,
  listarSemanasConCarga,
  obtenerDatosSeekersSinCarga,
  verificarSeekerDeGestor,
};
