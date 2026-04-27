function errorHandler(err, req, res, _next) {
  console.error(err);

  if (err.code === '23505') {
    return res.status(409).json({ error: 'El registro ya existe (valor duplicado)' });
  }

  if (err.code === '23503') {
    return res.status(400).json({ error: 'Referencia inválida: el recurso relacionado no existe' });
  }

  const estado = err.status || 500;
  const mensaje = estado < 500 ? err.message : 'internal server error';

  return res.status(estado).json({ error: mensaje });
}

class ErrorApp extends Error {
  constructor(mensaje, estado = 400) {
    super(mensaje);
    this.status = estado;
  }
}

module.exports = errorHandler;
module.exports.ErrorApp = ErrorApp;
