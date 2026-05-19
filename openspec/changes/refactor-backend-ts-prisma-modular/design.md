## Context

Backend Express (JS) con ~3.9k LOC en `src/`. Acceso a datos vía `config/database.js` (`consultar`/`consultarUno`, pool `pg`, SQL crudo). Dos arquitecturas conviviendo: **camino A** (`clients`, `users`, `projects`, `timeEntries`, `projections`) con `route → service → data`; **camino B** (`comercial`, `ingresos`, `gastosAdmin`, `costosVenta`, `costosPorPersona`) con SQL + validación + reglas inline en el route. Sin tests. Deploy dual: Vercel serverless (`api/index.js → src/app`) y `docker-compose` local. La DB ya está en inglés a nivel columnas; el contrato API está en español por decisión registrada en `.ai/context.md`. El frontend (`frontend/src/services/api.js`) consume claves español y paths mixtos.

Plan completo aprobado: `C:\Users\nicmora\.claude\plans\necesito-hacer-un-refactor-replicated-corbato.md`.

## Goals / Non-Goals

**Goals:**
- Un único patrón de arquitectura modular por dominio para los 9 módulos.
- TypeScript strict en todo el backend; tipos derivados de Prisma y Zod.
- Prisma como ORM y dueño de migraciones (de aquí en adelante).
- Red de seguridad: tests de contrato que congelan body + status por endpoint.
- Cero cambios en componentes del frontend; impacto acotado a `api.js`.

**Non-Goals:**
- Cambiar comportamiento funcional, reglas de negocio o el shape del JSON (claves siguen en español).
- Tocar el frontend más allá de `frontend/src/services/api.js`.
- Rediseñar el schema de la DB (solo se introspecciona el actual y se vuelve baseline).
- Hexagonal/DDD puro, event sourcing, CQRS u otra ceremonia desproporcionada para un CRUD de 50–200 usuarios.
- Migrar el frontend a TS o realinearlo al idioma (iteración futura).

## Decisions

### D1 — Capa `mapper` como anti-corruption layer del contrato
Cada módulo expone `*.mapper.ts` que traduce entidad/inglés ⇄ DTO/español. Es el **único** punto donde vive la traducción de idioma del contrato. Reemplaza el patrón actual de alias SQL (`legal_name AS razon_social`) + funciones ad-hoc tipo `formatearCliente`. *Alternativa descartada:* seguir con alias SQL en Prisma `$queryRaw` — perpetúa SQL crudo y no aprovecha el ORM.

### D2 — Prisma introspección → baseline → migrate dev
Bootstrap: DB recreada desde `schema.sql`+`data.sql` → `prisma db pull` genera `schema.prisma` espejando las 31 tablas → `prisma migrate diff --from-empty` produce `migrations/0_init` → `prisma migrate resolve --applied` la marca aplicada sin re-ejecutarla. De ahí en más `prisma migrate dev`. `data.sql` → `prisma/seed.ts` (ejecuta el SQL tal cual; catálogos quedan en español como contenido de negocio). *Alternativa descartada:* mantener `schema.sql` como fuente de verdad con Prisma solo introspect-only — el usuario decidió que Prisma gobierne migraciones; menos fricción a futuro.

### D3 — Strangler con oráculo de contrato
La suite de tests de contrato (supertest contra `app`, DB vía `prisma migrate reset`) se escribe **antes** de tocar cada módulo y fija status + claves JSON + cuerpo de error. El refactor de un módulo es correcto sólo si la suite sigue verde. El swap es módulo-a-módulo en `app.ts` (router viejo JS → router nuevo TS), borrando los archivos viejos del módulo recién migrado. *Alternativa descartada:* big-bang — riesgo inaceptable sin tests previos y con la consigna de no romper el frontend.

### D4 — Renombre de paths coordinado en un commit
Cuando un módulo cambia de path, el mismo commit toca: `*.routes.ts` (nuevo path), el test de contrato (nuevo path, mismo body/status) y `frontend/src/services/api.js` (URL). El body y los status NO cambian: eso es lo que el oráculo congela. Paths ya en inglés (`/clients`, `/users`, `/projects`, `/time-entries`, `/projections`, `/config`) no se tocan.

### D5 — Coexistencia JS/TS durante la transición
`tsconfig.json` con `allowJs: true` y `strict: true`. Dev con `tsx watch`; build `tsc → dist/`. `api/index.js` y `vercel.json` apuntan a `dist/`; build de Vercel corre `prisma generate && tsc`. Se valida un deploy preview en Fase 0 (no al final) para no descubrir el problema de build/serverless tarde.

### D6 — `shared/` transversal
`shared/db/prisma.ts` (PrismaClient singleton, reemplaza `config/database.js`), `shared/config/env.ts` (env validado con Zod al boot), `shared/http/errorHandler.ts` (preserva exactamente `{ error }` + códigos PG `23505`/`23503`), `shared/http/asyncHandler.ts` (elimina el `try/catch + next(err)` repetido en cada handler), `shared/middlewares/{auth,validate}.ts` (`req.user`, validate basado en Zod).

### D7 — Granularidad de módulos
`finance` como un módulo con subdominios (`periods`, `revenues`, `adminExpenses`, `salesCosts`, `personnelCosts`) y `commercial` aparte. Colapsa el camino B sin explotar en 6 carpetas casi vacías.

## Risks / Trade-offs

- **`prisma db pull` no espeja exactamente la BD** (tipos custom, defaults, PK compuestas de las tablas puente) → diff manual `schema.prisma` vs `schema.sql` en el bootstrap antes de hacer baseline; ajustar `@@map`/`@map`/`@@id` a mano si hace falta.
- **Build TS + Prisma en Vercel serverless** (cold start, generación de client, connection storm de Postgres) → validar deploy preview en Fase 0; `connection_limit` en el `DATABASE_URL` de prod.
- **Renombre de path descoordinado** rompe el frontend silenciosamente → regla D4: route + test + `api.js` en el mismo commit + smoke del flujo afectado.
- **Regresión de shape del JSON** invisible sin tests → el oráculo de contrato se escribe antes y debe pasar idéntico pre/post cada módulo; cubrir casos de error, no solo happy path.
- **Drift Prisma ⇄ DB a futuro** → workflow único documentado en `CLAUDE.md` (editar `schema.prisma` → `migrate dev`); prohibido editar SQL a mano.
- **`auth` al final** concentra el riesgo de tokens/email → orden deliberado: módulos simples primero para consolidar el patrón antes de tocar autenticación.

## Migration Plan

1. **Fase 0 — Andamiaje**: toolchain TS, deploy Vercel temprano a `dist/`, Prisma bootstrap (D2), `shared/` (D6), reescribir regla DB de `CLAUDE.md`, suite base de tests de contrato. Sin cambio observable.
2. **Fase 1 — Piloto `clients`**: módulo completo con el patrón canónico (path ya en inglés). Verde → patrón validado.
3. **Fase 2 — Roll-out**: `config → users → projects → timeEntries(+approvals) → projections → finance → commercial → auth`. Un módulo por iteración; tests verdes + smoke entre cada uno; renombre de paths coordinado (D4).
4. **Fase 3 — Limpieza**: borrar `config/database.js`, `data/`, `services/`, middlewares JS, `src/index.js`; quitar `express-validator` si quedó sin uso; actualizar `.ai/context.md` + `backend/README.md`.

**Rollback:** por ser strangler, cada módulo es un swap aislado en `app.ts`; revertir = restaurar el router JS del módulo y su entrada en `api.js`. Los módulos ya migrados no se ven afectados.

## Open Questions

- ¿`connection_limit`/pooling exacto para Vercel prod? — se calibra al validar el deploy preview en Fase 0.
- ¿`prisma db pull` representa fielmente las 4 tablas puente con PK compuesta y la auditoría tiered? — se verifica en el bootstrap; ajuste manual de `schema.prisma` si difiere.
