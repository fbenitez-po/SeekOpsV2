import type { Express } from 'express';
import { apiReference } from '@scalar/express-api-reference';
import { buildOpenApiDocument } from './document';

// Mounts the docs surface at the root (outside API_PREFIX, like /health):
//   GET /docs/openapi.json  → the generated OpenAPI 3.1 document
//   GET /docs               → Scalar UI (fetches the JSON above)
// Open by design: the documented surface is the public third-party (dashboard) API.
export function mountDocs(app: Express): void {
  app.get('/docs/openapi.json', (_req, res) => {
    res.json(buildOpenApiDocument());
  });

  app.get(
    '/docs',
    apiReference({
      url: '/docs/openapi.json',
      title: 'Seekops API',
    }),
  );
}
