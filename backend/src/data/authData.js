const { consultarUno, consultar } = require('../config/database');

async function buscarUsuarioPorEmail(email) {
  return consultarUno(
    `SELECT u.id, u.email, u.password_hash, u.nombres, u.apellidos, u.avatar_url, u.enabled as activo
     FROM users u WHERE u.email = $1`,
    [email]
  );
}

async function buscarUsuarioPorId(id) {
  return consultarUno(
    `SELECT id, email, nombres, apellidos, avatar_url, enabled as activo FROM users WHERE id = $1`,
    [id]
  );
}

async function obtenerRolesDelUsuario(usuarioId) {
  const filas = await consultar(
    `SELECT ug.codigo FROM user_groups ug
     JOIN user_group_members ugm ON ugm.group_id = ug.id
     WHERE ugm.user_id = $1 AND ug.enabled = true`,
    [usuarioId]
  );
  return filas.map((f) => f.codigo);
}

async function obtenerProyectosDelUsuario(usuarioId) {
  return consultar(
    `SELECT p.id, p.nombre, pu.rol
     FROM projects p
     JOIN project_users pu ON pu.project_id = p.id
     WHERE pu.user_id = $1 AND p.enabled = true`,
    [usuarioId]
  );
}

async function guardarRefreshToken(usuarioId, token, expiracion) {
  await consultar(
    `INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)
     ON CONFLICT (user_id) DO UPDATE SET token = $2, expires_at = $3`,
    [usuarioId, token, expiracion]
  );
}

async function buscarRefreshToken(token) {
  return consultarUno(
    `SELECT rt.user_id, rt.expires_at FROM refresh_tokens rt WHERE rt.token = $1`,
    [token]
  );
}

async function eliminarRefreshToken(token) {
  await consultar(`DELETE FROM refresh_tokens WHERE token = $1`, [token]);
}

async function guardarTokenReset(usuarioId, token, expiracion) {
  await consultar(
    `INSERT INTO password_reset_tokens (user_id, token, expires_at)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id) DO UPDATE SET token = $2, expires_at = $3`,
    [usuarioId, token, expiracion]
  );
}

async function buscarTokenReset(token) {
  return consultarUno(
    `SELECT user_id, expires_at FROM password_reset_tokens WHERE token = $1`,
    [token]
  );
}

async function actualizarPassword(usuarioId, passwordHash) {
  await consultar(
    `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
    [passwordHash, usuarioId]
  );
}

async function eliminarTokenReset(token) {
  await consultar(`DELETE FROM password_reset_tokens WHERE token = $1`, [token]);
}

module.exports = {
  buscarUsuarioPorEmail,
  buscarUsuarioPorId,
  obtenerRolesDelUsuario,
  obtenerProyectosDelUsuario,
  guardarRefreshToken,
  buscarRefreshToken,
  eliminarRefreshToken,
  guardarTokenReset,
  buscarTokenReset,
  actualizarPassword,
  eliminarTokenReset,
};
