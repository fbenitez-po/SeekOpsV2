const { ErrorApp } = require('../middlewares/errorHandler');
const data = require('../data/timeEntryData');

function construirEntrada(entrada, lineas, aprobaciones) {
  const totalHoras = lineas.reduce((s, l) => s + parseInt(l.horas || 0), 0);
  const totalExtras = lineas.reduce((s, l) => s + parseInt(l.horas_extra || 0), 0);

  return {
    id: entrada.id,
    semana: entrada.semana,
    estado: entrada.estado,
    fecha_carga: entrada.fecha_carga,
    usuario: {
      id: entrada.user_id || entrada.usuario_id,
      nombres: entrada.nombres,
      apellidos: entrada.apellidos,
    },
    lineas: lineas.map((l) => ({
      id: l.id,
      proyecto: {
        id: l.project_id,
        nombre: l.proyecto_nombre,
        codigo: l.proyecto_codigo,
      },
      categoria_ingreso: l.categoria_ingreso_id
        ? { id: l.categoria_ingreso_id, nombre: l.categoria_nombre }
        : null,
      horas: parseInt(l.horas),
      horas_extra: parseInt(l.horas_extra),
      comentario: l.comentario || '',
    })),
    total_horas: totalHoras,
    total_extras: totalExtras,
    aprobaciones: (aprobaciones || []).map((a) => ({
      id: a.id,
      accion: a.accion,
      comentario: a.comentario,
      sugerencia_horas: a.sugerencia_horas,
      sugerencia_extras: a.sugerencia_extras,
      realizado_por: { id: a.realizado_por_id, nombres: a.nombres, apellidos: a.apellidos },
      fecha: a.fecha,
    })),
  };
}

async function listar(usuarioId, roles, proyectosIds, filtros) {
  const { entradas, total } = await data.listarEntradas({ usuarioId, roles, proyectosIds, filtros });

  const limite = Math.min(parseInt(filtros.limit) || 20, 100);
  const pagina = parseInt(filtros.page) || 1;

  const entradasConDetalle = await Promise.all(
    entradas.map(async (e) => {
      const [lineas, aprobaciones] = await Promise.all([
        data.obtenerLineasDeEntrada(e.id),
        data.obtenerAprobacionesDeEntrada(e.id),
      ]);
      return construirEntrada(e, lineas, aprobaciones);
    })
  );

  return {
    data: entradasConDetalle,
    pagination: { page: pagina, limit: limite, total, pages: Math.ceil(total / limite) },
  };
}

async function obtenerPorId(id, usuarioId, roles) {
  const entrada = await data.buscarEntradaPorId(id);
  if (!entrada) throw new ErrorApp('Registro no encontrado', 404);

  const esDuenio = entrada.user_id === usuarioId;
  const esAdmin = roles.includes('ADMIN');

  if (!esDuenio && !esAdmin) {
    const linea = await data.obtenerProyectoDeEntrada(id);
    if (linea) {
      const esGestor = await data.esGestorDelProyecto(usuarioId, linea.project_id);
      if (!esGestor) throw new ErrorApp('No tenés permiso para ver este registro', 403);
    }
  }

  const [lineas, aprobaciones] = await Promise.all([
    data.obtenerLineasDeEntrada(id),
    data.obtenerAprobacionesDeEntrada(id),
  ]);

  return construirEntrada(entrada, lineas, aprobaciones);
}

async function crear(usuarioId, roles, body) {
  const { semana, lineas } = body;

  if (!lineas || lineas.length === 0) {
    throw new ErrorApp('Debe incluir al menos una línea', 400);
  }

  const proyectosEnCarga = lineas.map((l) => l.proyecto_id);
  if (new Set(proyectosEnCarga).size !== proyectosEnCarga.length) {
    throw new ErrorApp('No se puede repetir el mismo proyecto en una carga', 400);
  }

  const entradaExistente = await data.verificarEntradaExistente(usuarioId, semana);
  if (entradaExistente) {
    throw new ErrorApp(`Ya existe un registro para la semana ${semana} en estado PENDIENTE o APROBADO`, 400);
  }

  for (const linea of lineas) {
    if (linea.horas < 0) throw new ErrorApp('horas debe ser mayor o igual a 0', 400);
    if (linea.horas_extra !== undefined && (linea.horas_extra < 0 || linea.horas_extra > 8)) {
      throw new ErrorApp('horas_extra debe ser entre 0 y 8', 400);
    }

    const asignado = await data.verificarProyectoAsignado(usuarioId, linea.proyecto_id);
    if (!asignado) throw new ErrorApp('No tenés acceso al proyecto indicado', 403);
  }

  const esGestor = roles.includes('GESTOR') && !roles.includes('SEEKER');
  const estado = esGestor ? 'APROBADO' : 'PENDIENTE';

  return data.crearEntrada({ usuarioId, semana, estado, lineas });
}

async function ajustar(id, usuarioId, lineas) {
  const entrada = await data.buscarEntradaPorId(id);
  if (!entrada) throw new ErrorApp('Registro no encontrado', 404);
  if (entrada.user_id !== usuarioId) throw new ErrorApp('Solo el dueño del registro puede editarlo', 403);
  if (entrada.estado !== 'OBSERVADO') throw new ErrorApp('Solo se pueden editar registros en estado OBSERVADO', 403);

  for (const linea of lineas) {
    if (linea.horas < 0) throw new ErrorApp('horas debe ser mayor o igual a 0', 400);
    if (linea.horas_extra !== undefined && (linea.horas_extra < 0 || linea.horas_extra > 8)) {
      throw new ErrorApp('horas_extra debe ser entre 0 y 8', 400);
    }
  }

  const entradaActualizada = await data.actualizarLineasEntrada(id, lineas, usuarioId);
  const lineasActualizadas = await data.obtenerLineasDeEntrada(id);
  return construirEntrada({ ...entradaActualizada, user_id: usuarioId, nombres: '', apellidos: '' }, lineasActualizadas, []);
}

async function aprobar(id, usuarioId, roles) {
  const entrada = await data.buscarEntradaPorId(id);
  if (!entrada) throw new ErrorApp('Registro no encontrado', 404);
  if (entrada.estado !== 'PENDIENTE') throw new ErrorApp('Solo se pueden aprobar registros en estado PENDIENTE', 403);

  if (!roles.includes('ADMIN')) {
    const lineaPrincipal = await data.obtenerProyectoDeEntrada(id);
    if (!lineaPrincipal) throw new ErrorApp('Registro no encontrado', 404);
    const esGestor = await data.esGestorDelProyecto(usuarioId, lineaPrincipal.project_id);
    if (!esGestor) throw new ErrorApp('Solo el gestor del proyecto o un administrador puede aprobar', 403);
  }

  await data.registrarAprobacion({ entradaId: id, accion: 'APROBAR', usuarioId });
  return { id, estado: 'APROBADO', aprobado_en: new Date().toISOString() };
}

async function observar(id, usuarioId, roles, datos) {
  const entrada = await data.buscarEntradaPorId(id);
  if (!entrada) throw new ErrorApp('Registro no encontrado', 404);
  if (entrada.estado !== 'PENDIENTE') throw new ErrorApp('Solo se pueden observar registros en estado PENDIENTE', 403);

  if (!datos.comentario_observacion) throw new ErrorApp('comentario_observacion es requerido', 400);

  if (!roles.includes('ADMIN')) {
    const lineaPrincipal = await data.obtenerProyectoDeEntrada(id);
    const esGestor = lineaPrincipal && await data.esGestorDelProyecto(usuarioId, lineaPrincipal.project_id);
    if (!esGestor) throw new ErrorApp('Solo el gestor del proyecto o un administrador puede observar', 403);
  }

  await data.registrarAprobacion({ entradaId: id, accion: 'OBSERVAR', usuarioId, datos });
  return { id, estado: 'OBSERVADO', observado_en: new Date().toISOString(), ...datos };
}

async function rechazar(id, usuarioId, roles, datos) {
  const entrada = await data.buscarEntradaPorId(id);
  if (!entrada) throw new ErrorApp('Registro no encontrado', 404);
  if (entrada.estado !== 'PENDIENTE') throw new ErrorApp('Solo se pueden rechazar registros en estado PENDIENTE', 403);

  if (!datos.razon_rechazo) throw new ErrorApp('razon_rechazo es requerida', 400);

  if (!roles.includes('ADMIN')) {
    const lineaPrincipal = await data.obtenerProyectoDeEntrada(id);
    const esGestor = lineaPrincipal && await data.esGestorDelProyecto(usuarioId, lineaPrincipal.project_id);
    if (!esGestor) throw new ErrorApp('Solo el gestor del proyecto o un administrador puede rechazar', 403);
  }

  await data.registrarAprobacion({ entradaId: id, accion: 'RECHAZAR', usuarioId, datos });
  return { id, estado: 'RECHAZADO', rechazado_en: new Date().toISOString(), ...datos };
}

module.exports = { listar, obtenerPorId, crear, ajustar, aprobar, observar, rechazar };
