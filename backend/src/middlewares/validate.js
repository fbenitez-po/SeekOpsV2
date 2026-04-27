const { validationResult } = require('express-validator');

function validate(req, res, next) {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    const primerError = errores.array()[0];
    return res.status(400).json({ error: primerError.msg });
  }
  next();
}

module.exports = validate;
