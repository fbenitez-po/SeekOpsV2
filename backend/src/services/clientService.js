const { ErrorApp } = require('../middlewares/errorHandler');
const data = require('../data/clientData');

function formatearCliente(c) {
  return {
    id: c.id,
    nombre: c.nombre,
    razon_social: c.razon_social,
    razon_comercial: c.razon_comercial,
    ruc: c.ruc,
    nombre_contacto: c.nombre_contacto,
    email_contacto: c.email_contacto,
    telefono: c.telefono,
    direccion: c.direccion,
    categoria_usuario: c.cat_id ? { id: c.cat_id, nombre: c.cat_nombre } : null,
    segmentacion: c.seg_id ? { id: c.seg_id, nombre: c.seg_nombre } : null,
    sector: c.sec_id ? { id: c.sec_id, nombre: c.sec_nombre } : null,
    activo: c.activo,
    creado_en: c.created_at,
  };
}

async function listar(filtros) {
  const { clientes, total } = await data.listarClientes(filtros);
  const limite = Math.min(parseInt(filtros.limit) || 20, 100);
  const pagina = parseInt(filtros.page) || 1;

  return {
    data: clientes.map((c) => ({ ...formatearCliente(c), proyectos_count: parseInt(c.proyectos_count) })),
    pagination: { page: pagina, limit: limite, total, pages: Math.ceil(total / limite) },
  };
}

async function obtenerPorId(id) {
  const cliente = await data.buscarClientePorId(id);
  if (!cliente) throw new ErrorApp('Cliente no encontrado', 404);

  const proyectos = await data.obtenerProyectosDeCliente(id);

  return {
    ...formatearCliente(cliente),
    actualizado_en: cliente.updated_at,
    proyectos: proyectos.map((p) => ({ id: p.id, nombre: p.nombre, codigo: p.codigo, activo: p.activo })),
  };
}

async function crear(datos) {
  if (await data.rucExiste(datos.ruc)) {
    throw new ErrorApp('El RUC ya está registrado en otro cliente', 400);
  }
  return data.crearCliente(datos);
}

async function actualizar(id, datos) {
  const existe = await data.buscarClientePorId(id);
  if (!existe) throw new ErrorApp('Cliente no encontrado', 404);

  if (datos.ruc && await data.rucExiste(datos.ruc, id)) {
    throw new ErrorApp('El RUC ya está en uso por otro cliente', 400);
  }

  return data.actualizarCliente(id, datos);
}

async function toggleActivo(id) {
  const existe = await data.buscarClientePorId(id);
  if (!existe) throw new ErrorApp('Cliente no encontrado', 404);
  return data.toggleActivo(id);
}

module.exports = { listar, obtenerPorId, crear, actualizar, toggleActivo };
