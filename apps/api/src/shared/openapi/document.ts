import { createDocument } from 'zod-openapi';
import { env } from '../config/env';
import { buildPaths, getTags } from './registry';

// Assembles the OpenAPI 3.1 document from whatever the documented-route helper
// has registered. Paths are stored relative to the server URL, so `servers` is
// set to API_PREFIX and "Try it out" calls resolve to e.g. /api/v1/dashboard/...
export function buildOpenApiDocument() {
  return createDocument({
    openapi: '3.1.0',
    info: {
      title: 'Seekops API',
      version: '1.0.0',
      description:
        'Documentación de la API de Seekops. Generada desde los schemas Zod del código. ' +
        'Cobertura actual: módulo Dashboard (integraciones con terceros, read-only). ' +
        'El resto de los módulos se documentará en cambios posteriores.',
    },
    servers: [{ url: env.API_PREFIX, description: env.NODE_ENV }],
    tags: getTags(),
    paths: buildPaths(),
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT de acceso emitido por POST /auth/login.',
        },
      },
    },
  });
}
