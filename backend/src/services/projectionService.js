const data = require('../data/projectionData');
const projectData = require('../data/projectData');

function crearError(msg, status = 400) {
  const e = new Error(msg);
  e.statusCode = status;
  return e;
}

async function listar(filtros, gestorId, roles) {
  return data.listar(filtros, gestorId, roles);
}

async function crear(body, gestorId, roles) {
  const { project_id, user_id, fecha_inicio, fecha_fin, horas_proyectadas } = body;

  if (!project_id || !user_id || !fecha_inicio || !fecha_fin || !horas_proyectadas) {
    throw crearError('project_id, user_id, fecha_inicio, fecha_fin y horas_proyectadas son requeridos');
  }

  if (new Date(fecha_fin) < new Date(fecha_inicio)) {
    throw crearError('fecha_fin debe ser mayor o igual a fecha_inicio');
  }

  if (parseInt(horas_proyectadas) <= 0) {
    throw crearError('horas_proyectadas debe ser mayor a 0');
  }

  // Verificar que el gestor tenga acceso al proyecto
  if (!roles.includes('ADMIN')) {
    const proyecto = await projectData.obtenerPorId(project_id, gestorId, roles);
    if (!proyecto || proyecto.gestor_id !== gestorId) {
      throw crearError('No tenés permisos para proyectar horas en este proyecto', 403);
    }
  }

  const proyeccion = await data.crear(body, gestorId);
  return data.obtenerPorId(proyeccion.id);
}

async function actualizar(id, body, gestorId, roles) {
  const existente = await data.obtenerPorId(id);
  if (!existente) throw crearError('Proyección no encontrada', 404);

  if (!roles.includes('ADMIN') && existente.gestor_id !== gestorId) {
    throw crearError('No tenés permisos para modificar esta proyección', 403);
  }

  const { fecha_inicio, fecha_fin, horas_proyectadas } = body;

  if (fecha_inicio && fecha_fin && new Date(fecha_fin) < new Date(fecha_inicio)) {
    throw crearError('fecha_fin debe ser mayor o igual a fecha_inicio');
  }

  if (horas_proyectadas !== undefined && parseInt(horas_proyectadas) <= 0) {
    throw crearError('horas_proyectadas debe ser mayor a 0');
  }

  await data.actualizar(id, {
    fecha_inicio: fecha_inicio || existente.fecha_inicio,
    fecha_fin: fecha_fin || existente.fecha_fin,
    horas_proyectadas: horas_proyectadas || existente.horas_proyectadas,
    notas: body.notas !== undefined ? body.notas : existente.notas,
  }, gestorId);

  return data.obtenerPorId(id);
}

async function eliminar(id, gestorId, roles) {
  const existente = await data.obtenerPorId(id);
  if (!existente) throw crearError('Proyección no encontrada', 404);

  if (!roles.includes('ADMIN') && existente.gestor_id !== gestorId) {
    throw crearError('No tenés permisos para eliminar esta proyección', 403);
  }

  await data.eliminar(id);
  return { message: 'Proyección eliminada correctamente' };
}

async function listarAlertas(gestorId, roles) {
  return data.listarAlertas(gestorId, roles);
}

module.exports = { listar, crear, actualizar, eliminar, listarAlertas };
