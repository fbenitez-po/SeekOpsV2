const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { ErrorApp } = require('../middlewares/errorHandler');
const authData = require('../data/authData');
const emailService = require('./emailService');

function generarAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  });
}

function generarRefreshToken(payload) {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });
}

async function login(email, password) {
  const usuario = await authData.buscarUsuarioPorEmail(email);

  if (!usuario) {
    throw new ErrorApp('Credenciales inválidas', 401);
  }

  if (!usuario.activo) {
    throw new ErrorApp('Usuario inactivo. Contactá al administrador.', 403);
  }

  const passwordValida = await bcrypt.compare(password, usuario.password_hash);
  if (!passwordValida) {
    throw new ErrorApp('Credenciales inválidas', 401);
  }

  const roles = await authData.obtenerRolesDelUsuario(usuario.id);
  const proyectos = await authData.obtenerProyectosDelUsuario(usuario.id);

  const payload = { usuario_id: usuario.id, roles, proyectos_ids: proyectos.map((p) => p.id) };

  const accessToken = generarAccessToken(payload);
  const refreshToken = generarRefreshToken({ usuario_id: usuario.id });

  const expiracion = new Date();
  expiracion.setDate(expiracion.getDate() + 7);
  await authData.guardarRefreshToken(usuario.id, refreshToken, expiracion);

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in: 3600,
    usuario: {
      id: usuario.id,
      email: usuario.email,
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      avatar_url: usuario.avatar_url,
      roles,
      proyectos: proyectos.map((p) => ({ id: p.id, nombre: p.nombre, rol: p.rol })),
    },
  };
}

async function logout(refreshToken) {
  await authData.eliminarRefreshToken(refreshToken);
}

async function renovarToken(refreshToken) {
  let payload;
  try {
    payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw new ErrorApp('Refresh token inválido o expirado', 401);
  }

  const tokenGuardado = await authData.buscarRefreshToken(refreshToken);
  if (!tokenGuardado) {
    throw new ErrorApp('Refresh token inválido o expirado', 401);
  }

  if (new Date(tokenGuardado.expires_at) < new Date()) {
    await authData.eliminarRefreshToken(refreshToken);
    throw new ErrorApp('Refresh token inválido o expirado', 401);
  }

  const usuario = await authData.buscarUsuarioPorId(payload.usuario_id);
  const roles = await authData.obtenerRolesDelUsuario(payload.usuario_id);
  const proyectos = await authData.obtenerProyectosDelUsuario(payload.usuario_id);

  const nuevoToken = generarAccessToken({
    usuario_id: usuario.id,
    roles,
    proyectos_ids: proyectos.map((p) => p.id),
  });

  return { access_token: nuevoToken, expires_in: 3600 };
}

async function solicitarReset(email) {
  const usuario = await authData.buscarUsuarioPorEmail(email);
  if (!usuario) return;

  const token = uuidv4();
  const expiracion = new Date(Date.now() + 60 * 60 * 1000); // 1 hora
  await authData.guardarTokenReset(usuario.id, token, expiracion);

  await emailService.enviarResetPassword(email, usuario.nombres, token);
}

async function confirmarReset(token, nuevaPassword, confirmarPassword) {
  if (nuevaPassword !== confirmarPassword) {
    throw new ErrorApp('Las contraseñas no coinciden', 400);
  }

  const registro = await authData.buscarTokenReset(token);
  if (!registro || new Date(registro.expires_at) < new Date()) {
    throw new ErrorApp('El link de recuperación expiró o es inválido', 410);
  }

  const hash = await bcrypt.hash(nuevaPassword, 10);
  await authData.actualizarPassword(registro.user_id, hash);
  await authData.eliminarTokenReset(token);
}

module.exports = { login, logout, renovarToken, solicitarReset, confirmarReset };
