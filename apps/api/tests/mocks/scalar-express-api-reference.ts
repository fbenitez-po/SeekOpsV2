import type { RequestHandler } from 'express';

// @scalar/express-api-reference is ESM-only and cannot be parsed by ts-jest
// (CommonJS). The docs UI is not exercised by tests, so this stub stands in for
// it via moduleNameMapper. Manual /docs review covers the real handler.
export function apiReference(): RequestHandler {
  return (_req, _res, next) => next();
}
