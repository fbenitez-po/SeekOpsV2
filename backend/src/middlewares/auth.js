const jwt = require('jsonwebtoken');

function verificarToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

function soloAdmin(req, res, next) {
  if (!req.usuario?.roles?.includes('ADMIN')) {
    return res.status(403).json({ error: 'Solo administradores pueden realizar esta acción' });
  }
  next();
}

function soloGestorOAdmin(req, res, next) {
  const roles = req.usuario?.roles || [];
  if (!roles.includes('GESTOR') && !roles.includes('ADMIN')) {
    return res.status(403).json({ error: 'Solo gestores o administradores pueden realizar esta acción' });
  }
  next();
}

module.exports = { verificarToken, soloAdmin, soloGestorOAdmin };
