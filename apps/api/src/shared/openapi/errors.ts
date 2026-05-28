import 'zod-openapi';
import { z } from 'zod';
import type { ZodOpenApiResponseObject, ZodOpenApiResponsesObject } from 'zod-openapi';

// Mirrors the error contract produced by shared/http/errorHandler.ts:
// `{ error: string, details?: { field, message }[] }`.
const ValidationDetailSchema = z.object({
  field: z.string(),
  message: z.string(),
});

export const ErrorResponseSchema = z
  .object({
    error: z.string(),
    details: z.array(ValidationDetailSchema).optional(),
  })
  .meta({ id: 'ErrorResponse' });

const ERROR_DESCRIPTIONS: Record<number, string> = {
  400: 'Solicitud inválida (validación o referencia inválida)',
  401: 'No autenticado: token ausente, inválido o expirado',
  403: 'Acceso denegado: el rol del usuario no permite esta acción',
  404: 'Recurso no encontrado',
  409: 'Conflicto: el registro ya existe o viola una restricción',
};

// Builds reusable OpenAPI response entries for the AppError hierarchy
// (ValidationError 400, Unauthorized 401, Forbidden 403, NotFound 404, Conflict 409).
export function errorResponses(...codes: number[]): ZodOpenApiResponsesObject {
  const responses: Record<string, ZodOpenApiResponseObject> = {};
  for (const code of codes) {
    responses[String(code)] = {
      description: ERROR_DESCRIPTIONS[code] ?? 'Error',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    };
  }
  return responses;
}
