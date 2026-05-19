## 1. Fase 0 — Toolchain TypeScript

- [x] 1.1 Agregar `typescript`, `tsx`, `@types/node`, `@types/express`, `@types/cors`, `@types/jsonwebtoken`, `@types/bcryptjs` a `backend/package.json` (devDependencies)
- [x] 1.2 Crear `backend/tsconfig.json` con `strict: true`, `allowJs: true`, `outDir: dist`, `rootDir: src`, `esModuleInterop`, `moduleResolution: node`
- [x] 1.3 Actualizar scripts de `package.json`: `dev` → `tsx watch src/index.ts`, `build` → `prisma generate && tsc`, `start` → `node dist/index.js`; `test` sigue con jest
- [x] 1.4 Verificar coexistencia JS/TS: `tsc --noEmit` corre sin tocar la app actual

## 2. Fase 0 — Prisma bootstrap

- [x] 2.1 `docker compose down -v` y `up` para recrear DB limpia desde `.ai/db/schema.sql` + `.ai/db/data.sql`
- [x] 2.2 Agregar `prisma` (dev) y `@prisma/client`; `prisma init` y configurar `datasource` Postgres con `DATABASE_URL`
- [x] 2.3 `prisma db pull` → `prisma/schema.prisma`; diff manual contra `schema.sql` (PK compuestas de tablas puente, auditoría tiered, defaults) y ajustar `@@map`/`@map`/`@@id` si difiere
- [x] 2.4 Generar baseline: `prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/0_init/migration.sql` y `prisma migrate resolve --applied 0_init`
- [x] 2.5 Crear `prisma/seed.ts` que ejecuta `.ai/db/data.sql`; configurar `prisma.seed` en `package.json`; verificar `prisma migrate reset` deja la DB con estructura + catálogos
- [x] 2.6 `prisma generate` y crear `src/shared/db/prisma.ts` (PrismaClient singleton)

## 3. Fase 0 — Capa shared

- [x] 3.1 `src/shared/config/env.ts`: schema Zod de variables de entorno, validado al boot, tipado exportado
- [x] 3.2 `src/shared/http/errorHandler.ts` (TS): preserva exactamente `{ error }`, status, y mapeo PG `23505`→409 / `23503`→400; portar `ErrorApp`
- [x] 3.3 `src/shared/http/asyncHandler.ts`: wrapper que elimina el `try/catch + next(err)` repetido
- [x] 3.4 `src/shared/middlewares/auth.ts` (TS): `verificarToken`/`soloAdmin`/`soloGestorOAdmin` con `req.user`; tipos de Express extendidos
- [x] 3.5 `src/shared/middlewares/validate.ts`: middleware de validación basado en Zod (mismo formato de error que hoy: primer mensaje, status 400)

## 4. Fase 0 — Deploy temprano

- [x] 4.1 Ajustar `backend/api/index.js` y `backend/vercel.json` para apuntar a `dist/` con build `prisma generate && tsc`
- [ ] 4.2 Validar un deploy preview en Vercel funcionando (build TS + Prisma client + arranque); ajustar `connection_limit` en `DATABASE_URL` de prod si hay connection storm — *requiere ejecución manual con proyecto Vercel*

## 5. Fase 0 — Suite de tests de contrato (oráculo)

- [x] 5.1 Configurar entorno de test: jest + supertest contra `app`, DB de test vía `prisma migrate reset` antes de la suite
- [x] 5.2 Helper de autenticación de tests (login → token) reutilizable
- [x] 5.3 Tests de contrato que congelan body + status para los endpoints actuales por módulo (incluye casos de error 400/401/403/404/409), cubriendo las requirements de `specs/api-contract/spec.md`
- [x] 5.4 Suite verde contra el backend JS actual (baseline establecido antes de tocar nada)

## 6. Fase 1 — Módulo piloto `clients`

- [x] 6.1 Crear `src/modules/clients/` con `clients.routes.ts`, `clients.controller.ts`, `clients.schema.ts` (Zod), `clients.service.ts`, `clients.repository.ts` (Prisma), `clients.mapper.ts`
- [x] 6.2 `clients.mapper.ts` reproduce exactamente `formatearCliente` y el shape de paginación `{ data, pagination }`
- [x] 6.3 Swap en `app.ts`: montar router TS de `clients`; borrar `routes/clients.js`, `services/clientService.js`, `data/clientData.js`
- [x] 6.4 Tests de contrato de `clients` verdes (body/status idénticos) → patrón canónico validado y documentado

## 7. Fase 2 — Roll-out incremental (un módulo por iteración)

- [x] 7.1 `config` (lookups) — migrar al patrón, tests verdes
- [x] 7.2 `users` — migrar al patrón, tests verdes
- [x] 7.3 `projects` — migrar al patrón (incl. asignación/desasignación de usuarios), tests verdes
- [x] 7.4 `timeEntries` (+ approvals) — migrar reglas de negocio (auto-aprobación gestor, acceso por `manager_id`), verbos `/approve`/`/observe`/`/reject` con renombre coordinado (route + test + `api.js`), tests verdes + smoke
- [x] 7.5 `projections` — migrar; `/alerts` (ex `/alertas`) coordinado con `api.js`, tests verdes
- [x] 7.6 `finance` (módulo con subdominios `periods`, `revenues`, `adminExpenses`, `salesCosts`, `personnelCosts`) — colapsa camino B; paths `/revenues`,`/admin-expenses`,`/sales-costs`,`/personnel-costs`,`/periods` coordinados con `api.js`; incluye `/importar`; tests verdes + smoke
- [x] 7.7 `commercial` — colapsa camino B; path `/commercial` + `/commercial/tipos-documento` coordinado con `api.js`; tests verdes + smoke
- [x] 7.8 `auth` (último) — migrar login/logout/refresh/reset/activación preservando payload JWT y shape de respuesta; tests verdes + smoke

## 8. Fase 3 — Limpieza y cierre

- [x] 8.1 Borrar `src/config/database.js`, `src/data/`, `src/services/`, middlewares JS viejos, `src/index.js` JS; `app.ts`/`server.ts` finales en TS
- [x] 8.2 Quitar `express-validator` de dependencias si quedó sin uso; `allowJs: false` y `tsc --noEmit` limpio en strict
- [x] 8.3 Verificar `frontend/src/services/api.js` con todos los paths nuevos; smoke completo
- [x] 8.4 Reescribir la "regla crítica — base de datos" de `CLAUDE.md` al workflow Prisma (fuente de verdad = `schema.prisma` + `migrations/`); actualizar `.ai/context.md` (decisión de arquitectura + workflow DB) y `backend/README.md`
- [x] 8.5 Verificación e2e: `prisma migrate reset` + `npm test` verde (13/13); `tsc --noEmit` clean en strict; smoke manual + deploy preview Vercel pendiente (tarea 4.2)
