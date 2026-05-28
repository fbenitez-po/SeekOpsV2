# Contexto del proyecto — Seekops

> **Fuente de verdad del proyecto.** Describe el estado *vigente*. Actualizar cada vez que se tome una decisión relevante.
> Es lo primero que lee Claude al inicio de cada sesión.
> El historial cronológico de decisiones vive en [`decisions.md`](decisions.md). La fuente de verdad del **schema** es `apps/api/prisma/schema.prisma`; los scripts SQL de `docs/db/` son espejos que deben mantenerse sincronizados (ver "Base de datos: Prisma + espejos SQL").

---

## Qué es este producto

Seekops es una plataforma web para registro de horas trabajadas de empleados (seekers) en proyectos de clientes. Reemplaza una versión obsoleta (v1) con mejor UX/DX y stack moderno. Objetivo: que los seekers carguen horas activamente sin recordatorios, con un flujo de aprobación claro y gestión completa de usuarios, clientes, proyectos, finanzas y comercial.

Escala: 50-200 usuarios activos. Idioma del producto: español latino (neutro).

---

## Stack tecnológico

- **Frontend:** React + Vite + shadcn/ui + Tailwind CSS
- **Backend:** Node.js + Express + TypeScript strict + Prisma 7 (ORM) + Zod
- **Base de datos:** PostgreSQL
- **Autenticación:** JWT (access + refresh tokens)
- **Logging:** pino + pino-http (estructurado, request-id por petición, nivel por `LOG_LEVEL`)
- **Deploy:** Vercel (backend serverless) / docker-compose (local)

---

## Roles

- **Seeker** — Registra horas en proyectos asignados. Interfaz simple para cargar horas semanales sin fricción.
- **Gestor** — Aprueba/observa/rechaza horas del equipo de sus proyectos. Visibilidad de pendientes.
- **Administrador** — Gestiona usuarios, clientes, proyectos, finanzas y comercial. Backoffice completo.

Un usuario puede tener múltiples roles en múltiples proyectos (ej. Seeker en A, Gestor en B).

---

## Estado actual

**Etapa: Código (completado).** El proyecto está implementado y se ejecuta end-to-end con docker-compose (db + backend + frontend).

- Backend modular en TypeScript strict, validado con `tsc`, `lint` (0 errores) y suite de tests (unit + contract).
- Frontend React + Vite implementado, fiel a los previews aprobados.
- Schema gestionado por Prisma (`schema.prisma` + `migrations/` + `seed.ts`).
- Migración de la "API Dashboard" de v1 completada (4 recursos read-only para BI).

Para el detalle de cómo se llegó aquí, ver [`decisions.md`](decisions.md).

---

## Entidades principales

- **User** — Seeker/Gestor/Admin; múltiples roles en múltiples proyectos. Pertenece a una o más áreas (M2M `user_area`).
- **Client** — Cliente para el que se trabaja. `legal_name` (NOT NULL) es el identificador principal.
- **Project** — Proyecto de un cliente; tiene usuarios asignados (`project_user`) y un `manager_id`. Puede aplicar a un área (`area_id` nullable).
- **TimeEntry** — Registro semanal de un usuario (`week_start_date` lunes + `week_end_date` domingo, `UNIQUE(user_id, week_start_date)`). Sin columna `status`.
- **TimeEntryLine** — Una línea por proyecto (y categoría, en proyectos de área) dentro de una TimeEntry. Sin columna `status`.
- **TimeEntryApproval** — **Única fuente de verdad del estado de aprobación.** Una fila por línea.

---

## Modelo de aprobación de horas (vigente)

`time_entry_approvals` es la única fuente de verdad; ni `time_entries` ni `time_entry_lines` tienen columna `status`.

- Al cargar el seeker, se crea una fila por línea en estado `PENDIENTE` (`time_entry_line_id` UNIQUE).
- El gestor la muta a `APROBADO`, `APROBADO_CON_OBSERVACION` o `RECHAZADO`.
- Al aprobar con observación, las horas sugeridas se guardan en `suggested_hours`/`suggested_extra_hours`; **`time_entry_lines.hours` nunca se modifica**.
- **Horas efectivas:** `APROBADO_CON_OBSERVACION` → sugeridas · `APROBADO` → cargadas · `PENDIENTE`/`RECHAZADO` → 0 (no cuentan en totales ni finanzas).
- **Unidad de aprobación:** por línea. En proyectos de área, hay una línea (y por tanto una aprobación) por cada categoría.
- Payloads de approve/observe/reject identifican la línea con `linea_id`.
- No hay badge de estado de semana en la UI: cada pantalla muestra el bloque de semana con proyectos + estados desplegables.

---

## Decisiones de arquitectura (vigentes)

- **Autenticación:** JWT stateless. El JWT incluye `email`, que se propaga route → service → repository para auditoría.
- **Patrón estándar de módulo:** `apps/api/src/modules/<dominio>/` sigue `routes.ts` (declarativo) → `controller.ts` (handlers finos) → `service.ts` (reglas de negocio + errores semánticos) → `repository.ts` (Prisma) → `schema.ts` (Zod, si hay inputs) → `mapper.ts` (DB → DTO, si hay transformación). Compartido en `src/shared/{db,config,http,middlewares,services}`.
- **Versionado / context path:** todas las rutas de negocio bajo `env.API_PREFIX` (default `/api/v1`, configurable por env). `/health` queda en la raíz.
- **Jerarquía de errores:** `AppError` + subclases `ValidationError(400, details?)`, `UnauthorizedError(401)`, `ForbiddenError(403)`, `NotFoundError(404)`, `ConflictError(409)`. Los servicios lanzan la subclase; las rutas no devuelven errores con `res.status(...)` directo.
- **Contrato API en español:** las claves JSON se exponen en español vía la capa `mapper`, aunque los identificadores internos (DB, código) sean en inglés. **Única excepción:** el módulo `dashboard` expone claves en inglés (compatibilidad v1).
- **Auditoría tiered:** bloque estándar al final de cada tabla = `created_at`, `created_by` (email o `'admin'` por defecto, sin FK), `updated_at` (nullable), `updated_by`, `deleted_at`, `deleted_by`, `is_active`. No todas lo llevan completo: tablas puente, tokens y logs llevan menos.
- **Soft delete:** campo `is_active`. Las tablas con soft delete tienen además `deleted_at`/`deleted_by`.
- **PKs:** UUID `gen_random_uuid()` en entidades; las tablas puente usan PK compuesta (sin `id` surrogate).
- **Email (nodemailer):** dos tipos — bienvenida (link activación 48h) y reset de contraseña (link 1h). Sin SMTP configurado, el link se imprime en consola (dev).
- **Activación de cuenta:** usuarios nuevos no tienen contraseña; se genera token (`password_reset_tokens`, 48h) y se envía link a `/activar-cuenta?token=...`. Reutiliza `POST /api/auth/confirmar-reset`.
- **Acceso de Gestor a proyectos:** un Gestor accede a todos los proyectos donde es `manager_id`, tenga o no fila en `project_user` (listar proyectos, guardar horas, listar entradas).
- **Áreas de usuario (M2M):** tabla `user_area` (PK compuesta). Un usuario debe tener ≥1 área.
- **Categorías:** `project_categories` con `is_area_type` cubre categorías de proyecto y de ingreso/área (5 codes área: `RECLUTAMIENTO`, `CAPACITACION`, `COMERCIAL`, `AREA`, `CULTURA`).
- **Proyecciones de horas:** tabla `hour_projections` (rangos `start_date`/`end_date`, `projected_hours` múltiplos de 0.5, `work_category_id` opcional). Alertas en `GET /projections/alertas`.
- **Módulo Finanzas:** tablas `periods` (mensuales, `is_closed`), `revenues` (por `project_id`+`period_id`), `admin_expenses`, `sales_costs`, `personnel_costs` (`compensation`, `business_days`, `hours_per_day`).
- **Módulo Comercial:** tablas `document_types` y `commercial_records` (vinculan propuestas/contratos a proyectos y `owner_id`; `price`, `currency`, `document_type_id`, `has_contract`, `is_billed`).
- **Módulo Dashboard (BI):** endpoints read-only, abiertos, array plano con claves en inglés de v1 (`/api/dashboard/{seekers,clients,commercial,project}`).
- **Logging (pino):** logger central en `src/shared/logging/` (`logger.ts` + `httpLogger.ts`). `pino-http` loguea cada petición con un `x-request-id` correlacionado (reusa el header entrante o genera UUID). Nivel por `LOG_LEVEL` (default `info`), `silent` en test, `pino-pretty` en dev / JSON en prod. Redacta password/tokens/`authorization`. **Los logs de negocio van en la capa `service`** (mutaciones y eventos de seguridad; nunca lecturas ni repositories), con actor (`email`) + id del recurso y mensaje estable en inglés. El `errorHandler` loguea el 500 vía `req.log` sin alterar el contrato de error.

---

## Infraestructura / Deploy

### Docker startup (servicio `api`)
El CMD del Dockerfile ejecuta: `prisma migrate deploy` → `tsx prisma/seed.ts` → `node dist/index.js`.
- `tsx` se invoca con ruta explícita (`node_modules/.bin/tsx`) — Prisma corre el seed vía `sh -c` sin agregar `.bin` al PATH.
- El seed es idempotente (`createMany skipDuplicates: true`).
- El seed usa `PrismaPg` con `connectionString: process.env.DATABASE_URL`. Prisma 7 requiere el adapter; no usar `new PrismaClient()` sin él.

### Nginx proxy (servicio `ui`)
`proxy_pass http://api:3000;` **sin** trailing slash, para preservar la URI completa. Con barra final, Nginx reemplaza `/api/` por `/` y la API recibe `/v1/...` → 404. El host `api` es el nombre del servicio en `docker-compose.yml`.

### Prisma client — import correcto
El generador `provider = "prisma-client"` (Prisma 7) no genera `index.ts`; el entry point es `client.ts`:
```typescript
import { PrismaClient } from '../src/generated/prisma/client';  // ✓
import { PrismaClient } from '../src/generated/prisma';          // ✗ MODULE_NOT_FOUND
```

---

## Base de datos: Prisma + espejos SQL

**`apps/api/prisma/schema.prisma` es la fuente de verdad canónica** — es lo que construye y migra la BD vía `prisma migrate`. Los scripts SQL de `docs/db/` **no** son referencia congelada: son **espejos mantenidos** que deben reflejar el mismo cambio en el mismo PR. Si divergen, manda Prisma.

Espejos a sincronizar ante cualquier cambio de schema:
- `docs/db/schema.sql` — DDL completo en un único script (drops + recrea el schema; bootstrap de dev, no para producción). Sin migraciones incrementales: este archivo siempre representa el schema actual entero.
- `docs/db/seeds.sql` — datos iniciales/catálogos (espejo SQL de `seed.ts`). Se corre después de `schema.sql`.
- `docs/db/legacy-migration/legacy-migration.sql` — migración de datos v1→v2. Si un cambio de schema afecta tablas/columnas que toca esta migración, actualizarla también.
- `docs/db/schema.md` — documentación del schema.

### Workflow de migraciones (Prisma)

| Situación | Acción |
|-----------|--------|
| Nueva BD desde cero | `docker compose up` + `prisma migrate deploy` + `prisma db seed` |
| BD existente con datos | `prisma migrate dev --name <descripcion>` |
| Tests locales | `prisma migrate reset` |
| Producción | `prisma migrate deploy` (no interactivo, no resetea) |

**Checklist al cambiar el schema:** (1) editar `schema.prisma` → (2) `prisma migrate dev --name <desc>` → (3) sincronizar `docs/db/schema.sql`, `docs/db/seeds.sql` y, si aplica, `legacy-migration.sql` → (4) actualizar `docs/db/schema.md`. **Nunca** editar migraciones generadas ni aplicar SQL directo sin registrarlo en Prisma.

---

## Design System

Basado en shadcn/ui + Tailwind. El preview aprobado en `docs/preview/` es el contrato visual — el código debe coincidir exactamente.

| Token | Valor | Uso |
|-------|-------|-----|
| Primary | `#0f172a` (slate-900) | Botones, sidebar, links activos, logo |
| Background | `#f8fafc` (slate-50) | Fondo de páginas |
| Card/Section | `#ffffff` | Fondo de cards |
| Border | `#e2e8f0` (slate-200) | Bordes de cards, inputs, separadores |
| Text principal | `#0f172a` / `#1e293b` | Títulos y texto importante |
| Text secundario | `#64748b` (slate-500) | Labels, subtítulos, placeholders |
| Destructive | `#dc2626` (red-600) | Errores, rechazos |
| Success badge | `bg:#d1fae5 text:#065f46` | Estado APROBADO |
| Warning badge | `bg:#fef3c7 text:#92400e` | Estado PENDIENTE |
| Error badge | `bg:#fee2e2 text:#7f1d1d` | Estado RECHAZADO |
| Muted badge | `bg:#e5e7eb text:#374151` | Estado neutral |
| Font | Inter, 400/500/600/700 | Todo el sistema |
| Border radius card | `0.75rem` | Cards y secciones |
| Border radius input | `0.5rem` | Inputs y botones |
| Input focus ring | `box-shadow: 0 0 0 3px rgba(15,23,42,0.08)` | Focus state |

**Layout:**
- **Sidebar:** fondo `#0f172a`, texto blanco, ancho `224px` (w-56).
- **Contenido:** fondo `#f8fafc`, max-width 6xl, padding `1.5rem`.
- **Cards:** fondo blanco, borde `#e2e8f0`, radius `0.75rem`, padding `1.5rem`.
- **Login:** gradiente `135deg, #f8fafc → #f1f5f9`, logo box navy con "S" blanca.

Componentes: Button, Input, Select, Dialog, Table, Badge, Alert, Card. Tipografía Inter (escala xs-2xl). Grid 4px; breakpoints sm 640 / md 768 / lg 1024. Accesibilidad: focus rings visibles, contraste WCAG AA, labels asociados.

---

## Convenciones

### Idioma por capa

| Capa | Idioma | Ejemplos |
|------|--------|---------|
| Código (variables, funciones, columnas SQL, rutas API) | **Inglés** | `userId`, `created_at`, `/api/time-entries` |
| Comentarios de código | **Inglés** | `// fetch active projects` |
| Commits de git | **Español** | `feat: agregar endpoint de proyecciones` |
| Textos de UI | **Español latino, tuteo** | `Ingresa tu contraseña` |
| Claves JSON de la API | **Español** (excepto módulo `dashboard`) | `nombres`, `activo` |

**Regla de oro:** lo que ve el usuario en pantalla → español latino; lo que lee el dev en código → inglés.

### Estilo de nombres
- **JS/TS:** camelCase · **SQL:** snake_case · **Env vars:** SCREAMING_SNAKE_CASE.

### Copy (UI)
- Variante: **español latino neutro**, tuteo (`tú`). **No usar voseo rioplatense.**
- ✅ `Ingresa`, `Selecciona`, `tienes`, `puedes`, `enlace`, `restablecer`, `Inténtalo de nuevo`
- ❌ `Ingresá`, `Seleccioná`, `tenés`, `podés`, `link`, `resetear`, `Intentá de nuevo`

---

## Decisiones de producto

- **Período retroactivo:** sin límite — los seekers pueden cargar horas de cualquier semana.
- **Notificaciones:** email automático en eventos (aprobación, observación, rechazo).
- **Múltiples roles:** un usuario puede ser Seeker y Gestor en distintos proyectos (o ambos en el mismo).
- **Horas rechazadas:** definitivas — se visualizan sin editar; una nueva carga es una entrada nueva.
- **Aprobación:** no reversible — una vez aprobada no se desaprueba.
- **Auditoría:** se registra quién cambió qué y cuándo (vía `created_by`/`updated_by` con email).

---

## Historias de usuario

**Total: 30** (ver [`stories/README.md`](stories/README.md)).

- **Epic 00 — General (5):** Login, Reset password, Home Seeker, Home Gestor, Home Admin.
- **Epic 01 — Seeker (4):** Registrar horas, Ver historial, Re-cargar proyecto rechazado (US-003), Alerta semanas sin carga (US-004).
- **Epic 02 — Gestor (6):** Ver pendientes, Aprobar, Observar, Rechazar, Horas propias, Proyecciones (US-209).
- **Epic 03 — Admin (8):** CRUD usuarios/clientes/proyectos, asignar usuarios, administración de permisos/roles.
- **Epic 04 — Finanzas y Comercial (7):** Períodos, Ingresos, Gastos admin, Costos de venta, Costos por persona, Registros comerciales, Tipos de documento.

---

## Archivos de referencia

| Archivo | Contenido |
|---------|-----------|
| [`decisions.md`](decisions.md) | Historial cronológico de decisiones (ADR) |
| `apps/api/prisma/schema.prisma` | **Fuente de verdad del schema** — editar aquí, luego `prisma migrate dev` |
| `apps/api/prisma/migrations/` | Historial de migraciones Prisma (no editar a mano) |
| `apps/api/prisma/seed.ts` | Seeds iniciales (catálogos + admin) |
| `docs/db/schema.sql` | Espejo SQL del DDL completo (sincronizar con `schema.prisma`) |
| `docs/db/seeds.sql` | Espejo SQL de los datos iniciales (sincronizar con `seed.ts`) |
| `docs/db/schema.md` | Documentación del schema (mantener al día con `schema.prisma`) |
| `docs/db/legacy-migration/` | Plan y SQL de migración v1→v2 (sincronizar si cambia el schema) |
| `docs/brief.md` | Brief del producto |
| `docs/stories/README.md` | Índice de las 30 historias |
| `docs/ux/design-system.md` | Design System |
| `docs/ux/flows/rol-flows.md` | 12 flujos UX (Seeker 4, Gestor 3, Admin 5) |
| `docs/ux/screens/` | Especificaciones de pantallas |
| `docs/preview/index.html` | Índice de previews HTML interactivos |
| `docs/api/contracts-rol.md` | Contratos REST (request/response/errores) |
| `docs/api/mocks/` | Mocks JSON por recurso (auth, time-entries, users, clients, projects, config) |
