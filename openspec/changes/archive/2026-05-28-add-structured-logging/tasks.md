## 1. Dependencias y configuración

- [x] 1.1 Agregar `pino` y `pino-http` a dependencies; `pino-pretty` a devDependencies en `apps/api/package.json`
- [x] 1.2 Agregar `LOG_LEVEL` al schema Zod de [env.ts](apps/api/src/shared/config/env.ts) (`z.enum(['fatal','error','warn','info','debug','trace','silent']).default('info')`)
- [x] 1.3 Reemplazar el `console.error` de validación de env por la salida del logger (o dejarlo como único console pre-logger si el logger aún no existe en ese punto — documentar la decisión)
- [x] 1.4 Documentar `LOG_LEVEL` en `.env.example` (si existe el archivo)

## 2. Módulo de logging central

- [x] 2.1 Crear `apps/api/src/shared/logging/logger.ts` con la instancia pino: nivel desde `env.LOG_LEVEL`, `silent` forzado cuando `NODE_ENV=test`
- [x] 2.2 Configurar `redact` (paths: `req.headers.authorization`, `password`, `*.password`, `access_token`, `*.access_token`, `refresh_token`, `*.refresh_token`)
- [x] 2.3 Configurar transport por ambiente: `pino-pretty` solo en `development`; JSON a stdout en `production`; sin salida en `test`
- [x] 2.4 Crear/exportar el middleware `httpLogger` (pino-http): generación de request-id (reusar header `x-request-id` entrante si está presente) y `customLogLevel`/`customErrorMessage` para evitar doble log con el errorHandler

## 3. Integración en la app

- [x] 3.1 Montar `httpLogger` en [app.ts](apps/api/src/app.ts) antes de las rutas (después de `express.json`)
- [x] 3.2 Ajustar `/health` para que no inunde los logs (nivel `debug` o excluido de autoLogging)
- [x] 3.3 Integrar el logger en [errorHandler.ts](apps/api/src/shared/http/errorHandler.ts): reemplazar `console.error(err)` por log nivel `error` usando `req.log` (fallback al logger raíz), incluyendo el request-id; verificar que el cuerpo y status de la respuesta NO cambian

## 4. Migración de los console.* restantes

- [x] 4.1 Reemplazar `console.log` de arranque en [index.ts](apps/api/src/index.ts) por logger
- [x] 4.2 Reemplazar los `console.log` de email en dev en [email.service.ts](apps/api/src/shared/services/email.service.ts) por logger
- [x] 4.3 Verificar con grep que no quedan `console.*` en `apps/api/src` (fuera de `generated/`)

## 5. Instrumentación de eventos de negocio y seguridad

> Según la política de niveles y el mapa de instrumentación del design. Solo en la capa `service`; mutaciones y eventos de seguridad; actor (`email`) + id del recurso; mensajes en inglés, estables, sin interpolar datos. NO loguear lecturas/listados ni dentro de repositories.

- [x] 5.1 `modules/auth/auth.service.ts`: login ok (`info`), login fallido / token inválido (`warn`), refresh, reset solicitado/confirmado, activación de cuenta
- [x] 5.2 `modules/timeEntries`: carga de horas y approve/observe/reject (`info`, con actor + `linea_id`)
- [x] 5.3 `modules/users`, `modules/clients`, `modules/projects`: create / update / toggle-activo (`info`, actor + id)
- [x] 5.4 `modules/finance/*` y `modules/commercial`: cierre de período, altas de ingreso/costo/registro (`info`)
- [x] 5.5 `shared/services/email.service.ts`: SMTP no configurado / fallback dev (`warn`), envío fallido (`error`)
- [x] 5.6 Revisar que ningún log de negocio incluya payload completo, password, tokens ni PII no necesaria

## 6. Verificación

- [x] 6.1 Correr `npm test` y confirmar que la suite pasa sin salida de logs (silent en test) ni regresiones en tests de contrato
- [x] 6.2 Correr `npm run dev` y verificar formato pretty + request-id por petición en logs reales (golpear `/health` y un endpoint con error)
- [x] 6.3 Verificar manualmente que un body con `password`/token aparece redactado en la salida
- [x] 6.4 Ejecutar un flujo de aprobación end-to-end y confirmar que los eventos de negocio aparecen con actor + id y nivel correcto
- [x] 6.5 `npm run build` y `npm run lint` sin errores
