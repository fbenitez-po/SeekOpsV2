## Context

El backend (`apps/api`) es Express 4 + TypeScript strict + Prisma 7, con patrón modular `routes → controller → service → repository`. Hoy el logging es solo `console.*` en 6 sitios. Existe un `errorHandler` central único ([errorHandler.ts](apps/api/src/shared/http/errorHandler.ts)) que ya concentra el log de errores 500, y el `email` del usuario se propaga por las capas para auditoría. La config se valida con Zod en [env.ts](apps/api/src/shared/config/env.ts). El deploy productivo será un proceso Node de larga vida (ya no serverless), por lo que JSON a stdout es el formato natural para un agregador.

## Goals / Non-Goals

**Goals:**
- Logger central estructurado (pino) como único punto de configuración.
- Log automático por petición con request-id correlacionado (pino-http).
- Verbosidad configurable por `LOG_LEVEL` y formato según ambiente.
- Redacción de secretos (password, tokens, Authorization).
- Migrar los 6 `console.*` sin cambiar el contrato de la API ni el de errores.
- **Instrumentar eventos de negocio y seguridad** en la capa service, bajo una política de niveles consistente entre módulos.

**Non-Goals:**
- Envío a servicios externos (Datadog/Sentry/Loki): se hará encima de esto más adelante si hace falta.
- Métricas/tracing distribuido (OpenTelemetry).
- Logging de auditoría de negocio en BD (ya existe vía `created_by`/`updated_by`).
- Swagger/documentación de API (change separado, pospuesto).

## Decisions

**1. pino + pino-http (no winston).** Más liviano y rápido, JSON por defecto, request logging listo con `pino-http`. La superficie a migrar es chica (6 sitios) y no se necesita fan-out multi-transport. *Alternativa descartada:* winston — más flexible en transports pero más pesado y verboso de configurar, sin beneficio para este caso.

**2. Un solo módulo `shared/logging/`.** Exporta una instancia `logger` configurada y el middleware `httpLogger` (pino-http). Centraliza nivel, redacción y transport. *Alternativa descartada:* configurar pino inline en `app.ts` — dispersa la config y dificulta el silencio en test.

**3. Formato por ambiente vía transport, decidido por `NODE_ENV`.**
   - `development` → `pino-pretty` (legible, colores).
   - `production` → JSON a stdout (sin pretty; lo captura el runtime/agregador).
   - `test` → nivel `silent` para no ensuciar Jest.
   `pino-pretty` es `devDependency` (solo dev). *Alternativa descartada:* pretty siempre — costo de CPU y formato no apto para agregadores en prod.

**4. `LOG_LEVEL` en el schema Zod de env.** `z.enum(['fatal','error','warn','info','debug','trace','silent']).default('info')`. En `test` se fuerza `silent` independientemente del valor. Mantiene el patrón de "env validado o no arranca". 

**5. request-id por `pino-http`.** Usa el generador de id de pino-http (o reusa un header `x-request-id` entrante si está presente, para correlación entre servicios). El id queda en `req.log`, que se usa en controllers/errorHandler para que todas las líneas de un request compartan id.

**6. Redacción con `redact` de pino.** Paths: `req.headers.authorization`, `*.password`, `password`, `*.access_token`, `*.refresh_token`, `access_token`, `refresh_token`. Evita filtrar credenciales aun si un objeto completo se loguea por error.

**7. errorHandler usa `req.log` (o el logger raíz como fallback).** Reemplaza `console.error(err)` por log nivel `error` con el error y el request-id. El cuerpo y status de la respuesta HTTP no cambian — solo cambia cómo se registra.

**8. Política de instrumentación: el log de negocio vive en el `service`.** No en el controller (pasamanos) ni en el repository (ruido + duplicación). Las lecturas/listados no se loguean a mano (los cubre pino-http); el foco son **mutaciones** y **eventos de seguridad**. Cada log lleva el actor (`email`, ya propagado para auditoría) + el id del recurso, nunca el payload completo. *Alternativa descartada:* loguear en controllers — pierde el contexto de negocio y obliga a repetir en cada handler.

**Política de niveles (semántica consistente entre módulos):**

| Nivel | Cuándo | Ejemplos |
|-------|--------|----------|
| `error` | 500 / inesperado | errorHandler, fallo de envío de email, caída de BD |
| `warn` | manejado pero notable | login fallido, token inválido/expirado, SMTP no configurado (fallback dev) |
| `info` | evento de negocio exitoso + lifecycle | create/update/toggle, approve/observe/reject, carga de horas, login ok, arranque |
| `debug` | detalle verboso (solo dev) | payloads en dev, queries lentas |

**Mapa de instrumentación (qué services y qué eventos):**

| Módulo | Eventos | Nivel |
|--------|---------|-------|
| `auth` | login ok / login fallido / refresh / reset solicitado-confirmado / activación | info + warn en fallos |
| `timeEntries` | carga de horas, approve / observe / reject (actor + `linea_id`) | info |
| `users` / `clients` / `projects` | create / update / toggle-activo (actor + id) | info |
| `finance/*` | cierre de período, alta de ingreso/costo | info |
| `commercial` | alta/actualización de registro comercial | info |
| `email.service` | SMTP no configurado (fallback) / envío fallido | warn / error |
| arranque | servidor escuchando, env cargado | info |

**Mensajes estables y en inglés** (convención de código del proyecto): `msg` corto y estable (p. ej. `"client created"`, `"login failed"`) + campos estructurados para el detalle. El `msg` no se interpola con datos variables (eso va en campos), para que sea agrupable en el agregador.

## Risks / Trade-offs

- **Doble log de errores (pino-http + errorHandler)** → pino-http puede loguear el request completado y el errorHandler el error; configurar `customLogLevel`/`customErrorMessage` para no duplicar y mantener un solo evento de error con contexto.
- **Tests que asercionan sobre stdout/console** → `NODE_ENV=test` en silent lo evita; verificar que ningún test dependa de `console.*` actual antes de quitarlos.
- **`pino-pretty` ausente en prod** → es devDependency; el código solo debe intentar cargar el transport pretty cuando `NODE_ENV=development`, para no romper en prod por módulo faltante.
- **Ruido en logs de petición** (assets, /health) → ajustar nivel/autoLogging para no inundar; `/health` puede bajarse a `debug` o excluirse.
- **Fuga de PII en bodies** → la redacción cubre los campos sensibles conocidos; revisar que no se loguee el body completo por defecto en endpoints con datos personales.
- **Sobre-logueo / inconsistencia entre módulos** → la política de niveles y el mapa de instrumentación son la guía única; solo mutaciones y eventos de seguridad, nunca lecturas. Si un módulo no aparece en el mapa, no se instrumenta sin actualizar el design.
- **Mensajes con datos variables interpolados** → rompen el agrupamiento en el agregador; los datos van en campos estructurados, el `msg` queda estable.

## Migration Plan

1. Agregar deps: `pino`, `pino-http` (prod); `pino-pretty` (dev).
2. Crear `shared/logging/` con el logger configurado + `httpLogger`.
3. Agregar `LOG_LEVEL` al schema de `env.ts` y reemplazar su `console.error`.
4. Montar `httpLogger` en `app.ts` antes de las rutas.
5. Migrar `console.*` restantes (`index.ts`, `email.service.ts`) y el `errorHandler`.
6. Forzar `silent` en test y correr la suite (`npm test`) para confirmar sin regresiones.
7. Documentar `LOG_LEVEL` en `.env.example` si existe.

**Rollback:** revertir el commit; al ser un cambio cross-cutting pero aislado en `shared/logging/` + 4 archivos, el revert es directo y no toca datos ni schema.
