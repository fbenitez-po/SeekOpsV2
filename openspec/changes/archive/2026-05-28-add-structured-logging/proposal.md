## Why

El backend solo usa `console.*` en 6 lugares: sin niveles, sin estructura y sin contexto por petición. No se puede subir/bajar verbosidad por ambiente, ni filtrar por request o por usuario, ni correlacionar las líneas de un mismo request, ni alimentar de forma confiable un agregador de logs en producción. Es una mejora técnica (sin user story, acordado) que prepara observabilidad para el ambiente productivo (proceso Node de larga vida, ya no serverless).

## What Changes

- Incorporar **pino** como logger estructurado y **pino-http** para log automático por petición (método, ruta, status, duración).
- **Correlación por request-id**: cada petición recibe un id que aparece en todas sus líneas de log.
- **Niveles configurables** vía `LOG_LEVEL` por env (validado en el schema de `env.ts`).
- **Redacción** de datos sensibles: `password`, tokens y header `Authorization` nunca se escriben en los logs.
- **Formato por ambiente**: `pino-pretty` legible en desarrollo, JSON a stdout en producción.
- **Silencio en test** (`NODE_ENV=test`) para no ensuciar la salida de Jest.
- Reemplazar los 6 `console.*` actuales por el logger: arranque del servidor ([index.ts](apps/api/src/index.ts)), env inválido ([env.ts](apps/api/src/shared/config/env.ts)), email en dev ([email.service.ts](apps/api/src/shared/services/email.service.ts)) y error 500 ([errorHandler.ts](apps/api/src/shared/http/errorHandler.ts)).
- Integrar el logger en el **`errorHandler` único** existente, sin cambiar el contrato de respuestas de error.
- **Instrumentar eventos de negocio y seguridad** (no solo reemplazar los console): según una **política de niveles** documentada, agregar logs en la capa `service` para mutaciones y eventos relevantes — auth (login/reset/activación), flujo de aprobación de horas (carga/approve/observe/reject), CRUD de admin (create/update/toggle), finanzas/comercial y email. Cada log lleva actor (`email`) + id del recurso, **nunca** el payload completo ni datos sensibles.

## Capabilities

### New Capabilities
- `observability-logging`: logging estructurado del backend — logger central, log por request con correlación, niveles por ambiente, redacción de secretos y reglas de formato por entorno.

### Modified Capabilities
<!-- Ninguna: no cambian requisitos de capabilities existentes; el contrato de la API y el manejo de errores no se modifican. -->

## Impact

- **Dependencias nuevas:** `pino`, `pino-http` (prod); `pino-pretty` (dev).
- **Código afectado:**
  - Nuevo módulo de logger en `apps/api/src/shared/` (p. ej. `shared/logging/`).
  - `apps/api/src/app.ts` — montar middleware `pino-http` antes de las rutas.
  - `apps/api/src/shared/http/errorHandler.ts` — loguear vía logger en vez de `console.error`.
  - `apps/api/src/shared/config/env.ts` — agregar `LOG_LEVEL` al schema; reemplazar `console.error`.
  - `apps/api/src/index.ts` y `apps/api/src/shared/services/email.service.ts` — reemplazar `console.*`.
  - **Services instrumentados** con logs de negocio/seguridad: `modules/auth`, `modules/timeEntries`, `modules/users`, `modules/clients`, `modules/projects`, `modules/finance/*`, `modules/commercial`, y `shared/services/email.service.ts`.
- **Config/env:** nueva variable `LOG_LEVEL` (con default). Documentar en `.env.example` si existe.
- **Tests:** la suite Jest debe quedar silenciada por `NODE_ENV=test`; verificar que no haya regresiones en los tests de contrato.
- **Sin impacto en el contrato de la API:** no cambian rutas, payloads ni el shape de errores.
