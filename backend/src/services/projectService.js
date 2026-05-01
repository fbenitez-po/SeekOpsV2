const { ErrorApp } = require('../middlewares/errorHandler');
const data = require('../data/projectData');

function formatearProyecto(p) {
  return {
    id: p.id,
    codigo: p.codigo,
    nombre: p.nombre,
    descripcion: p.descripcion,
    cliente: p.cliente_id ? { id: p.cliente_id, nombre: p.cliente_nombre } : null,
    gestor: p.gestor_id ? { id: p.gestor_id, nombres: p.gestor_nombres, apellidos: p.gestor_apellidos } : null,
    segmentacion: p.seg_id ? { id: p.seg_id, nombre: p.seg_nombre } : null,
    categoria_ingreso: p.cat_id ? { id: p.cat_id, nombre: p.cat_nombre } : null,
    tipo_servicio: p.ts_id ? { id: p.ts_id, nombre: p.ts_nombre } : null,
    area: p.area_id ? { id: p.area_id, nombre: p.area_nombre } : null,
    fecha_inicio: p.fecha_inicio,
    fecha_fin: p.fecha_fin,
    activo: p.activo,
  };
}

async function listar(filtros, usuarioId, roles) {
  const { proyectos, total } = await data.listarProyectos(filtros, usuarioId, roles);
  const limite = Math.min(parseInt(filtros.limit) || 20, 100);
  const pagina = parseInt(filtros.page) || 1;

  return {
    data: proyectos.map((p) => ({ ...formatearProyecto(p), usuarios_count: parseInt(p.usuarios_count) })),
    pagination: { page: pagina, limit: limite, total, pages: Math.ceil(total / limite) },
  };
}

async function obtenerPorId(id, usuarioId, roles) {
  const proyecto = await data.buscarProyectoPorId(id);
  if (!proyecto) throw new ErrorApp('Proyecto no encontrado', 404);

  if (!roles.includes('ADMIN')) {
    const usuarios = await data.obtenerUsuariosDeProyecto(id);
    const tieneAcceso = usuarios.some((u) => u.id === usuarioId);
    if (!tieneAcceso) throw new ErrorApp('No tenés acceso a este proyecto', 403);
  }

  const usuarios = await data.obtenerUsuariosDeProyecto(id);
  return {
    ...formatearProyecto(proyecto),
    usuarios: usuarios.map((u) => ({
      id: u.id, nombres: u.nombres, apellidos: u.apellidos,
      email: u.email, rol: u.rol, avatar_url: u.avatar_url,
    })),
    creado_en: proyecto.created_at,
    actualizado_en: proyecto.updated_at,
  };
}

async function crear(datos) {
  if (await data.codigoExiste(datos.codigo)) {
    throw new ErrorApp('El código de proyecto ya existe', 400);
  }

  if (datos.fecha_inicio && datos.fecha_fin && new Date(datos.fecha_fin) < new Date(datos.fecha_inicio)) {
    throw new ErrorApp('fecha_fin no puede ser anterior a fecha_inicio', 400);
  }

  const gestorValido = await data.usuarioTieneRolGestor(datos.gestor_id);
  if (!gestorValido) {
    throw new ErrorApp('El gestor indicado no tiene rol de Gestor activo', 400);
  }

  return data.crearProyecto(datos);
}

async function actualizar(id, datos) {
  const existe = await data.buscarProyectoPorId(id);
  if (!existe) throw new ErrorApp('Proyecto no encontrado', 404);

  if (datos.codigo && await data.codigoExiste(datos.codigo, id)) {
    throw new ErrorApp('El código de proyecto ya existe', 400);
  }

  const fechaInicio = datos.fecha_inicio || existe.fecha_inicio;
  const fechaFin = datos.fecha_fin || existe.fecha_fin;
  if (fechaInicio && fechaFin && new Date(fechaFin) < new Date(fechaInicio)) {
    throw new ErrorApp('fecha_fin no puede ser anterior a fecha_inicio', 400);
  }

  return data.actualizarProyecto(id, datos);
}

async function toggleActivo(id) {
  const existe = await data.buscarProyectoPorId(id);
  if (!existe) throw new ErrorApp('Proyecto no encontrado', 404);
  return data.toggleActivo(id);
}

async function asignarUsuarios(id, usuarios) {
  const existe = await data.buscarProyectoPorId(id);
  if (!existe) throw new ErrorApp('Proyecto no encontrado', 404);

  const rolesValidos = ['SEEKER', 'GESTOR'];
  for (const u of usuarios) {
    if (!rolesValidos.includes(u.rol)) throw new ErrorApp('rol debe ser SEEKER o GESTOR', 400);
  }

  const resultado = await data.asignarUsuarios(id, usuarios);
  return { proyecto_id: id, ...resultado };
}

async function desasignarUsuario(proyectoId, usuarioId) {
  const desasignado = await data.desasignarUsuario(proyectoId, usuarioId);
  if (!desasignado) throw new ErrorApp('El usuario no está asignado a este proyecto', 404);
}

module.exports = { listar, obtenerPorId, crear, actualizar, toggleActivo, asignarUsuarios, desasignarUsuario };
