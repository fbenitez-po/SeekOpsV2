const { consultar, consultarUno } = require('../config/database');

// Convierte "S15/24" → Monday date expression en SQL usando parámetro posicional
// Retorna SQL expression que produce la fecha de inicio (lunes) de esa semana ISO
function sqlSemanaInicio(col) {
  return `to_date(
    (2000 + right(${col}, 2)::int)::text ||
    lpad(split_part(substring(${col} from 2), '/', 1), 3, '0'),
    'IYYYIW'
  )`;
}

async function listar(filtros, gestorId, roles) {
  const params = [];
  const condiciones = [];
  let idx = 1;

  if (!roles.includes('ADMIN')) {
    params.push(gestorId);
    condiciones.push(`p.manager_id = $${idx++}`);
  }

  if (filtros.proyecto_id) {
    params.push(filtros.proyecto_id);
    condiciones.push(`hp.project_id = $${idx++}`);
  }
  if (filtros.usuario_id) {
    params.push(filtros.usuario_id);
    condiciones.push(`hp.user_id = $${idx++}`);
  }

  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

  const sql = `
    SELECT
      hp.id,
      hp.project_id,
      p.name AS proyecto_nombre,
      p.code   AS proyecto_codigo,
      hp.user_id,
      u.first_name AS usuario_nombres,
      u.last_name AS usuario_apellidos,
      hp.start_date AS fecha_inicio,
      hp.end_date AS fecha_fin,
      hp.projected_hours AS horas_proyectadas,
      hp.notes AS notas,
      hp.work_category_id,
      wc.name AS work_category_nombre,
      hp.created_at,
      hp.updated_at
    FROM hour_projections hp
    JOIN projects p ON p.id = hp.project_id
    JOIN users    u ON u.id = hp.user_id
    LEFT JOIN work_categories wc ON wc.id = hp.work_category_id
    ${where}
    ORDER BY hp.start_date DESC, p.name, u.last_name
  `;

  return consultar(sql, params);
}

async function obtenerPorId(id) {
  const sql = `
    SELECT
      hp.id, hp.project_id, hp.user_id,
      hp.start_date AS fecha_inicio, hp.end_date AS fecha_fin,
      hp.projected_hours AS horas_proyectadas, hp.notes AS notas,
      hp.work_category_id, wc.name AS work_category_nombre,
      hp.created_at, hp.updated_at,
      p.name AS proyecto_nombre, p.manager_id AS gestor_id,
      u.first_name AS usuario_nombres, u.last_name AS usuario_apellidos
    FROM hour_projections hp
    JOIN projects p ON p.id = hp.project_id
    JOIN users    u ON u.id = hp.user_id
    LEFT JOIN work_categories wc ON wc.id = hp.work_category_id
    WHERE hp.id = $1
  `;
  return consultarUno(sql, [id]);
}

async function crear(datos, email) {
  const { project_id, user_id, fecha_inicio, fecha_fin, horas_proyectadas, notas, work_category_id } = datos;
  const sql = `
    INSERT INTO hour_projections
      (project_id, user_id, start_date, end_date, projected_hours, notes, work_category_id, created_by, updated_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)
    RETURNING id
  `;
  return consultarUno(sql, [project_id, user_id, fecha_inicio, fecha_fin, horas_proyectadas, notas || null, work_category_id || null, email]);
}

async function actualizar(id, datos, email) {
  const { fecha_inicio, fecha_fin, horas_proyectadas, notas, work_category_id } = datos;
  const sql = `
    UPDATE hour_projections
    SET start_date = $1,
        end_date = $2,
        projected_hours = $3,
        notes = $4,
        work_category_id = $5,
        updated_at = NOW(),
        updated_by = $6
    WHERE id = $7
    RETURNING id
  `;
  return consultarUno(sql, [fecha_inicio, fecha_fin, horas_proyectadas, notas || null, work_category_id || null, email, id]);
}

async function eliminar(id) {
  const sql = `DELETE FROM hour_projections WHERE id = $1 RETURNING id`;
  return consultarUno(sql, [id]);
}

// Retorna time_entries cargados en proyectos del gestor que NO tienen proyección vigente
async function listarAlertas(gestorId, roles) {
  const params = [];
  let idx = 1;
  let condicionGestor = '';

  if (!roles.includes('ADMIN')) {
    params.push(gestorId);
    condicionGestor = `AND p.manager_id = $${idx++}`;
  }

  const semanaInicio = sqlSemanaInicio('te.week');

  const sql = `
    SELECT
      te.id           AS time_entry_id,
      te.week         AS semana,
      te.status       AS estado,
      te.created_at   AS fecha_carga,
      u.id            AS usuario_id,
      u.first_name    AS usuario_nombres,
      u.last_name     AS usuario_apellidos,
      p.id            AS proyecto_id,
      p.name          AS proyecto_nombre,
      SUM(tel.hours)  AS horas_cargadas
    FROM time_entries te
    JOIN users u ON u.id = te.user_id
    JOIN time_entry_lines tel ON tel.time_entry_id = te.id
    JOIN projects p ON p.id = tel.project_id
    WHERE te.status <> 'RECHAZADO'
      ${condicionGestor}
      AND NOT EXISTS (
        SELECT 1 FROM hour_projections hp
        WHERE hp.project_id = tel.project_id
          AND hp.user_id    = te.user_id
          AND hp.start_date <= (${semanaInicio} + 6)
          AND hp.end_date   >= ${semanaInicio}
      )
    GROUP BY te.id, u.id, p.id
    ORDER BY te.created_at DESC
    LIMIT 50
  `;

  return consultar(sql, params);
}

module.exports = { listar, obtenerPorId, crear, actualizar, eliminar, listarAlertas };
