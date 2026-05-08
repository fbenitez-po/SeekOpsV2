const { v4: uuidv4 } = require('uuid');
const { ErrorApp } = require('../middlewares/errorHandler');
const data = require('../data/userData');
const authData = require('../data/authData');
const emailService = require('./emailService');

function formatearUsuario(u, grupos, areas) {
  return {
    id: u.id,
    email: u.email,
    nombres: u.nombres,
    apellidos: u.apellidos,
    numero_documento: u.numero_documento,
    puesto: u.puesto,
    celular: u.celular,
    avatar_url: u.avatar_url,
    activo: u.activo,
    staff: u.staff,
    super_usuario: u.super_usuario,
    equipo: u.equipo_id ? { id: u.equipo_id, nombre: u.equipo_nombre } : null,
    areas: areas || [],
    grupos: grupos || [],
    fecha_ingreso: u.fecha_ingreso,
    creado_en: u.created_at,
    actualizado_en: u.updated_at,
  };
}

async function listar(filtros) {
  const { usuarios, total } = await data.listarUsuarios(filtros);
  const limite = Math.min(parseInt(filtros.limit) || 20, 100);
  const pagina = parseInt(filtros.page) || 1;

  const usuariosFormateados = await Promise.all(
    usuarios.map(async (u) => {
      const grupos = await data.obtenerGruposDeUsuario(u.id);
      return formatearUsuario(u, grupos, u.areas || []);
    })
  );

  return {
    data: usuariosFormateados,
    pagination: { page: pagina, limit: limite, total, pages: Math.ceil(total / limite) },
  };
}

async function obtenerPorId(id) {
  const usuario = await data.buscarUsuarioPorId(id);
  if (!usuario) throw new ErrorApp('Usuario no encontrado', 404);

  const [grupos, areas, proyectos] = await Promise.all([
    data.obtenerGruposDeUsuario(id),
    data.obtenerAreasDeUsuario(id),
    data.obtenerProyectosDeUsuario(id),
  ]);

  return {
    ...formatearUsuario(usuario, grupos, areas),
    proyectos: proyectos.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      codigo: p.codigo,
      cliente: p.cliente,
      rol: p.rol,
      activo: p.activo,
    })),
    desactivado_en: usuario.deactivated_at || null,
  };
}

async function crear(datos) {
  if (await data.emailExiste(datos.email)) {
    throw new ErrorApp('El email ya está registrado en el sistema', 400);
  }
  if (await data.documentoExiste(datos.numero_documento)) {
    throw new ErrorApp('El número de documento ya está registrado', 400);
  }

  const fechaIngreso = new Date(datos.fecha_ingreso);
  if (fechaIngreso > new Date()) {
    throw new ErrorApp('La fecha de ingreso no puede ser una fecha futura', 400);
  }

  if (!datos.areas || datos.areas.length === 0) {
    throw new ErrorApp('Debe seleccionar al menos un área', 400);
  }

  const usuario = await data.crearUsuario(datos);

  const token = uuidv4();
  const expiracion = new Date(Date.now() + 48 * 60 * 60 * 1000);
  await authData.guardarTokenReset(usuario.id, token, expiracion);
  await emailService.enviarBienvenida(usuario.email, usuario.nombres, token);

  return usuario;
}

async function actualizar(id, datos) {
  const existe = await data.buscarUsuarioPorId(id);
  if (!existe) throw new ErrorApp('Usuario no encontrado', 404);

  if (datos.numero_documento && await data.documentoExiste(datos.numero_documento, id)) {
    throw new ErrorApp('El número de documento ya está en uso por otro usuario', 400);
  }

  if (datos.areas !== undefined && datos.areas.length === 0) {
    throw new ErrorApp('Debe seleccionar al menos un área', 400);
  }

  return data.actualizarUsuario(id, datos);
}

async function toggleActivo(id) {
  const existe = await data.buscarUsuarioPorId(id);
  if (!existe) throw new ErrorApp('Usuario no encontrado', 404);
  return data.toggleActivo(id);
}

module.exports = { listar, obtenerPorId, crear, actualizar, toggleActivo };
