import type { oas31 } from 'zod-openapi';

// Shared OpenAPI tag so the 4 dashboard sub-resources group together in the docs.
export const DASHBOARD_TAG: oas31.TagObject = {
  name: 'Dashboard / Integraciones',
  description:
    'Superficie de integración con terceros (BI). Endpoints read-only, abiertos, ' +
    'con claves en inglés heredadas de la API v1.',
};
