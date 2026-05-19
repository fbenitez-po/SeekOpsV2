## Why

El backend nació como MVP y necesita madurar: usa SQL crudo a mano sin ORM ni entidades, tiene una arquitectura inconsistente (5 módulos en 3 capas vs. 5 de Finanzas/Comercial con SQL + validación + reglas inline en el route), código interno en español que viola la convención del proyecto, y cero tests. Antes de seguir construyendo funcionalidad hay que pagar esta deuda técnica con una red de seguridad que garantice que el frontend sigue funcionando.

## What Changes

Refactor de deuda técnica **sin cambio funcional observable** (salvo renombre de paths). No agrega funcionalidad → no requiere nuevas historias de usuario.

- Migración de JavaScript a **TypeScript strict**.
- Adopción de **Prisma** como ORM: bootstrap por introspección desde la DB inicializada con `.ai/db/schema.sql` + `data.sql`; de ahí en más **Prisma maneja las migraciones** (`prisma migrate dev`). La fuente de verdad de la DB pasa de `.ai/db/schema.sql` a `prisma/schema.prisma` + `prisma/migrations/`; `data.sql` se recicla como `prisma/seed.ts`.
- **Arquitectura modular por dominio** pragmática: `src/modules/<dominio>/{routes,controller,schema,service,repository,mapper}` + `src/shared/{db,config,http,middlewares}`. Unifica los dos caminos actuales en un único patrón.
- Validación con **Zod** (reemplaza `express-validator`).
- Código interno y de dominio en **inglés** (`req.usuario`→`req.user`, etc.).
- **BREAKING (controlado): renombre de paths a inglés** — `/ingresos`→`/revenues`, `/gastos-admin`→`/admin-expenses`, `/costos-venta`→`/sales-costs`, `/costos-por-persona`→`/personnel-costs`, `/periodos`→`/periods`, `/comercial`→`/commercial`, y verbos de acción `/aprobar`→`/approve`, `/observar`→`/observe`, `/rechazar`→`/reject`, `/alertas`→`/alerts`. Impacto: **un solo archivo**, `frontend/src/services/api.js` (URLs centralizadas). Cero cambios en componentes del frontend.
- **Congelado (NO cambia)**: claves JSON de request/response permanecen en español vía capa `mapper`; status codes; formato de error `{ error }`; payload JWT y respuesta de login (`access_token`, `refresh_token`, `roles`, `email`).
- Estrategia: **tests de contrato primero** (supertest, DB vía `prisma migrate reset`) como oráculo que congela body + status; luego refactor incremental *strangler* módulo por módulo (orden: `clients` piloto → `config` → `users` → `projects` → `timeEntries` → `projections` → `finance` → `commercial` → `auth`).

## Capabilities

### New Capabilities
- `api-contract`: Garantías observables del contrato HTTP que el refactor debe preservar (claves JSON en español, status codes, formato de error, contrato JWT/login) y el renombre intencional de paths a inglés. Es el contrato que la suite de tests de contrato verifica antes y después de cada módulo.

### Modified Capabilities
<!-- No existen specs previos en openspec/specs/ y el refactor no modifica requisitos funcionales existentes. -->

## Impact

- **Backend (`backend/`)**: reescritura completa de la estructura de `src/` (de `routes/services/data` JS a `modules/<dominio>` + `shared/` TS). Nuevo `prisma/`. Nuevo `tsconfig.json`, toolchain `tsx`/`tsc`, suite de tests `tests/`.
- **Deploy**: `backend/vercel.json` + `backend/api/index.js` apuntando a `dist/` con build `prisma generate` + `tsc`; nota de `connection_limit` para serverless prod.
- **Frontend**: únicamente `frontend/src/services/api.js` (paths). Sin cambios en páginas/componentes.
- **DB**: nuevo workflow de migraciones gobernado por Prisma; `.ai/db/schema.sql`/`data.sql` quedan como origen histórico y seed.
- **Documentación de proyecto**: reescribir la "regla crítica — base de datos" de `CLAUDE.md` y actualizar `.ai/context.md` + `backend/README.md` (regla del propio proyecto al tomar decisiones de arquitectura/DB).
- **Dependencias**: + `typescript`, `prisma`/`@prisma/client`, `zod`, `tsx`, `@types/*`; − `express-validator` (al final, si queda sin uso).
