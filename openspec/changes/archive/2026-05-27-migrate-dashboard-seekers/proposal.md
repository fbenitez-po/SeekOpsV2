## Why

En v1 (Django/DRF) existe una "API Dashboard": un grupo de endpoints **abiertos, read-only y sin paginación** que exponen proyecciones planas de las entidades núcleo para que un consumidor externo (Power BI / servicios de reporting) las lea directo. Sus endpoints son `/seekers/`, `/api/project/`, `/api/commercial/` y `/api/client/`. v2 todavía no tiene esa superficie de integración.

Este change migra **solo el primero: `/seekers/`**. En v1 ese endpoint vive en el app `bi` ([apps/bi/views.py](../../../../seek-ops/wapp/apps/bi/views.py)) y hace literalmente `User.objects.all()` serializado con un subconjunto de campos. "Seeker" = un `User`; no tiene relación con el registro de horas (eso es otra cosa, ya migrada a `time_entries`).

El objetivo es replicar el comportamiento observable de v1 (misma forma de respuesta, mismas claves, sin auth) sobre el stack y el schema de v2, dejando la base de un módulo `dashboard` que luego alojará `projects`, `commercial` y `clients` (un change por recurso).

## What Changes

- **NUEVO** módulo paraguas `backend/src/modules/dashboard/` que agrupa los endpoints de integración externa, siguiendo el patrón de sub-módulos que ya usa `finance/`.
- **NUEVO** endpoint `GET /api/dashboard/seekers`: **abierto** (sin `verifyToken`/`adminOnly`, como v1), **sin paginación**, devuelve un **array plano** con **todos** los usuarios.
- **NUEVO** sub-módulo `dashboard/seekers/` con su propio `repository` read-only (lee `prisma.users` + `teams`), `service`, `controller`, `routes` y `mapper`.
- El `mapper` actúa como **capa anti-corrupción**: traduce el schema interno de v2 al contrato congelado de v1, en **inglés** (`position→job`, `mobile_phone→cellphone`, `teams.name→team`).
- Registro de `api.use('/dashboard', dashboardRoutes)` en [app.ts](../../../../SeekOpsV2/backend/src/app.ts), sin middleware de auth a nivel de módulo.

## Capabilities

### New Capabilities
- `dashboard-api`: superficie de integración externa, read-only y abierta, que expone proyecciones planas de entidades núcleo con un contrato de claves heredado de v1 (en inglés). Este change define el recurso `seekers`.

### Modified Capabilities
<!-- ninguna -->

## Impact

- **Backend (`backend/src/modules/dashboard/`):** nuevos archivos `dashboard.routes.ts` + `seekers/{routes,controller,service,repository,mapper}.ts`. No toca los módulos `users`/`projects`/`commercial`/`clients`.
- **Backend (`backend/src/app.ts`):** una línea `api.use('/dashboard', dashboardRoutes)`.
- **Schema/DB:** **sin cambios**. Solo lectura de tablas existentes (`users`, `teams`).
- **Contrato:** este endpoint es una **excepción consciente** a la regla del spec `api-contract` (claves en español). Las claves quedan en **inglés** para preservar la compatibilidad byte-a-byte con el consumidor BI de v1.
- **Auth:** abierto por ahora (igual que v1). El módulo deja un hook para introducir un guard (p. ej. token compartido estilo `require_token` de v1) sin tocar los sub-recursos.
- **Tests:** test de contrato (supertest) que verifica forma de array plano, claves en inglés y status 200 sin token.
