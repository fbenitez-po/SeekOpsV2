# Contexto del proyecto — [Nombre del proyecto]

> Fuente de verdad del proyecto. Actualizar cada vez que se tome una decisión relevante.
> Este archivo es lo primero que lee Claude al inicio de cada sesión.

---

## Qué es este producto

Seekops es una plataforma web moderna para registro de horas trabajadas de empleados (seekers) en proyectos de clientes. Reemplaza una versión obsoleta con mejor UX/DX y stack tecnológico moderno. Objetivo: que los seekers carguen horas activamente sin recordatorios, con flujo de aprobación claro y gestión completa de usuarios, clientes y proyectos.

---

## Stack tecnológico

- **Frontend:** React + Vite + shadcn/ui + Tailwind CSS
- **Backend:** Node.js + Express + **TypeScript strict** + **Prisma ORM** + Zod
- **Base de datos:** PostgreSQL
- **Autenticación:** JWT (access + refresh tokens)
- **Deploy:** Vercel (backend serverless en `api/index.js` → `dist/`)

---

## Público objetivo

- **Seeker** — Empleados de Seek que registran horas en proyectos asignados. Necesitan una interfaz simple para cargar horas semanales sin fricciones.
- **Gestor** — Líderes de proyecto que aprueban/observan horas del equipo asignado. Requieren visibilidad de estado de aprobaciones pendientes.
- **Administrador** — Gestiona usuarios, clientes y proyectos. Acceso backoffice completo y regularización de horas.

Escala: 50-200 usuarios activos. Idioma: Español.

---

## Flujo de trabajo del proyecto

Cada etapa requiere aprobación antes de avanzar a la siguiente:

```
Brief (completado)
  → Stories (completado)
  → UX flows (completado)
  → UX screens (completado)
  → Preview UX (completado)
  → Specification Summary (completado)
  → Resolver pendientes (completado)
  → DB (completado)
  → API + Mocks (completado)
  → Código (completado)
```

### Detalle de cada paso

- **Brief** `/pm-brief` — problema, solución, alcance MVP, entidades, flujos clave y stack. Requiere aprobación explícita antes de continuar.
- **Stories** `/pm-story` — historias por rol con criterios Given/When/Then. Solo avanzar cuando todas están en "lista para desarrollo" o los pendientes están documentados.
- **UX flows** `/ux-user-flow` — user flows con happy path, alternativos y fricciones. Validar con el cliente antes de ir a screens — cambiar un flujo es más barato que cambiar pantallas.
- **UX screens** `/ux-screen-spec` — especificación de cada pantalla con layout, estados, acciones y responsive. Una screen por archivo.
- **Preview UX** — HTML estático con identidad visual del cliente. Revisar con `/ux-design-review` antes de dar por aprobado.
- **Specification Summary** — consolidación centralizada de campos, validaciones, endpoints y estados. Une historias, flujos y pantallas en una referencia técnica única para Backend y Frontend. Genera automáticamente después de pantallas especificadas.
- **Resolver pendientes** — antes de tocar código, cerrar todos los ítems del `pendientes.md` que bloquean desarrollo (auth, email, validaciones, etc.). Pendientes sin resolver generan deuda técnica desde el día 1.
- **DB** `/db-schema-design` — schema PostgreSQL con DDL completo, índices justificados y seeds necesarios.
- **API + Mocks** `/be-api-contract` — contratos REST con request/response/errores por rol. Mocks JSON por endpoint para que frontend pueda avanzar en paralelo.
- **Código** — implementación sobre todo lo anterior ya validado.

Ver `WORKFLOW.md` para el checklist completo de cada etapa.

### Regla — nuevas funcionalidades siempre tienen historia de usuario

**Toda funcionalidad que se suma al sistema debe tener su historia de usuario antes o en el mismo momento en que se implementa.** No existe funcionalidad sin story.

Aplica a:
- Tabla nueva en el schema → debe existir una US que la justifique
- Endpoint nuevo en la API → debe existir una US que lo requiera
- Pantalla o componente nuevo en el frontend → ídem
- Lógica de negocio nueva en el backend → ídem

El flujo correcto es siempre **Story → Schema → API → Código**. Si se detecta código o schema sin story correspondiente, la story se escribe de inmediato, no después.

**Checklist al agregar cualquier funcionalidad nueva:**
1. ¿Existe una US que justifique esta funcionalidad? → si no, crearla antes de continuar
2. ¿La US tiene criterios de aceptación Given/When/Then? → si no, completarlos
3. ¿La US está en el epic correcto con ID único? → verificar que no haya conflictos de ID
4. ¿Se actualizó el conteo en `stories/README.md` y en `context.md`? → en la misma sesión

---

## Estado actual

- **Etapa:** Código (completado ✅) — Proyecto listo para ejecutar y testear
- **Completado:** 
  - 30 historias de usuario ✅
  - 12 flujos UX detallados ✅
  - 25 especificaciones de pantallas (.md) completadas y detalladas ✅
  - Campos y comportamientos definidos por pantalla ✅
  - 25+ previews HTML interactivos actualizados ✅
  - Índice central de navegación ✅
  - PostgreSQL schema completado (10 config + 4 core + 4 M2M + 6 transaccional + 5 finanzas + 2 comercial = 31 tablas) ✅
  - Architectural consistency: Home → Funcionalidad pattern applied to all roles ✅
- **Últimas actualizaciones:**
  - ✅ **Consolidación income_categories → project_categories (2026-05-22):** `income_categories` eliminada. `project_categories` gana `is_area_type BOOLEAN DEFAULT false` (5 categorías de área: RECLUTAMIENTO, CAPACITACION, COMERCIAL, AREA, CULTURA). FK `time_entry_lines.income_category_id` redirigida a `project_categories`. Endpoint `GET /config/categorias-ingreso` eliminado. `CargarHoras` usa `proyecto.categorias_ingreso` directamente. Proyectos de área: el seeker solo ve categorías asignadas al proyecto, con tipo área.
  - ✅ **Aprobación por categoría (2026-05-22):** La unidad de aprobación pasó de `(seeker × semana × proyecto)` a `(seeker × semana × proyecto × categoría_ingreso)` para proyectos de área. El gestor ve una tarjeta separada por cada categoría pendiente. `categoria_ingreso_id` se pasa como campo opcional en los payloads de approve/observe/reject; el `recordApproval` filtra el `updateMany` por `income_category_id` cuando está presente. Sin cambios en `time_entry_approvals`.
  - ✅ **Aprobación por proyecto (2026-05-21):** Rediseño completo del flujo de aprobación de horas. Ver decisiones clave abajo.
  - ✅ US-004 (nueva): Alerta de semanas sin carga en Home Seeker — muestra al ingresar las semanas desde `fecha_ingreso` hasta hoy que no tienen ninguna carga registrada. Permanente hasta que se carguen. Lógica en JS en el servicio para garantizar consistencia con el formato de semanas del frontend (`S15/26`).
  - ✅ Endpoint: `GET /time-entries/semanas-sin-carga` (solo requiere token, devuelve `{ semanas: [], total: N }`)
  - ✅ S-01-HOME-SEEKER: 4 secciones (pendientes, observadas, histórico) + button to S-01-CARGAR-HORAS
  - ✅ S-01-CARGAR-HORAS: Navegación semana, múltiples proyectos sin repetir, categoría condicional
  - ✅ S-02-HOME-GESTOR: Dashboard only (pendientes de equipo + mis pendientes) + button to S-02-CARGAR-HORAS-GESTOR
  - ✅ S-03-HOME-ADMIN: Dashboard only (métricas, acciones rápidas, horas pendientes global, alertas)
  - ✅ US-102 (Home Seeker): Updated to dashboard-only pattern
  - ✅ All homes now follow Home → Funcionalidad pattern (no complex forms in dashboards)
- **Bugs corregidos en testing (2026-04-24):**
  - ✅ `projectData.listarProyectos`: Gestor no veía sus proyectos en el combo — faltaba condición `OR p.gestor_id = usuario`
  - ✅ `timeEntryData.verificarProyectoAsignado`: Gestor no podía guardar horas en sus proyectos — misma causa, se agregó UNION con `projects WHERE gestor_id`
  - ✅ `timeEntryData.listarEntradas`: Panel del gestor mostraba 0 entradas — usaba `te.usuario_id` (columna inexistente), corregido a `te.user_id`
- **Adaptación backend al schema en inglés (2026-05-19):**
  - ✅ Backend alineado con `schema.sql` + `data.sql` (identificadores en inglés). 13 archivos: 6 en `backend/src/data/` + 7 en `backend/src/routes/`
  - ✅ Renombre solo del lado BD: 15 tablas (`user_groups→profiles`, `user_group_members→user_profile`, `user_areas→user_area`, `project_users→project_user`, `project_project_categories→project_project_category`, `periodos→periods`, `ingresos→revenues`, `gastos_admin→admin_expenses`, `costos_venta→sales_costs`, `costos_por_persona→personnel_costs`, `registros_comerciales→commercial_records`, `tipos_documento→document_types`) + ~50 columnas (`gestor_id→manager_id`, `enabled→is_active`, `semana→week`, `estado→status`, `allow_resubmit→can_resubmit`, etc.)
  - ✅ **Decisión:** la capa API/DTO se mantiene en español vía alias SQL (`first_name AS nombres`, `is_active as activo`) y claves `datos.*`. Sin cambios en services, rutas, validadores ni frontend. Sin cambios funcionales (auditoría como email y roles vía `profiles.code` ya estaban así)
  - ✅ Verificado end-to-end con docker-compose (db+backend+frontend): 17 GET 200, write paths (clientes, usuarios, proyectos, finanzas), 0 errores Postgres
- **Refactor backend TypeScript + Prisma + modular (2026-05-19):**
  - ✅ Migración completa de JS → TypeScript strict (`allowJs: false`, `tsc --noEmit` sin errores)
  - ✅ Prisma 7 como ORM (bootstrap por `db pull` + baseline `0_init`); fuente de verdad DB pasa a `prisma/schema.prisma` + `prisma/migrations/`
  - ✅ Arquitectura modular por dominio: `src/modules/<dominio>/{routes,controller,service,repository,mapper,schema}` + `src/shared/{db,config,http,middlewares,services}`
  - ✅ Validación con Zod (reemplaza express-validator)
  - ✅ Contrato API congelado: claves JSON en español vía capa mapper, status codes y formato `{ error }` invariantes
  - ✅ Paths anglicizados: `/periodos→/periods`, `/ingresos→/revenues`, `/gastos-admin→/admin-expenses`, `/costos-venta→/sales-costs`, `/costos-por-persona→/personnel-costs`, `/comercial→/commercial`, `/alertas→/alerts`, verbos `/aprobar→/approve`, `/observar→/observe`, `/rechazar→/reject`, `/importar→/import`, `/tipos-documento→/document-types`
  - ✅ Impacto frontend: solo `frontend/src/services/api.js` (cero cambios en componentes)
  - ✅ Suite de tests de contrato (13 tests supertest): body+status verificados pre/post refactor
  - ✅ Módulos migrados: clients, config, users, projects, timeEntries, projections, finance (periods, revenues, adminExpenses, salesCosts, personnelCosts), commercial, auth
- **Calidad y consistencia backend (2026-05-20):**
  - ✅ **Context path / versionado API:** todas las rutas de negocio se montan bajo `env.API_PREFIX` (default `/api/v1`). `/health` queda fuera del prefijo (path estable para load balancers). Frontend `baseURL` default actualizado a `/api/v1` y proxy de Vite ya no reescribe el path. Sin cambio en shapes de respuesta.
  - ✅ **Jerarquía de errores semántica:** `AppError` + subclases `ValidationError(400, details?)`, `UnauthorizedError(401)`, `ForbiddenError(403)`, `NotFoundError(404)`, `ConflictError(409)`. `errorHandler` solo loguea 5xx + errores no operacionales. `notFoundHandler` agregado para rutas inexistentes. Migrados ~40 `throw new AppError(msg, status)` a subclases (sin cambios en status codes).
  - ✅ **Validación completa:** `validateParams` agregado a `shared/middlewares/validate.ts`; los 3 validators ahora devuelven **todos** los issues de Zod como `details: [{ field, message }]` (aditivo a `{ error }` — no rompe consumidores). `IdParamSchema` en `shared/schemas/common.ts`.
  - ✅ **Patrón estándar aplicado a TODOS los módulos:** `commercial`, `auth` (sin controller/schema), `config` (solo routes+repo), y los 5 de finanzas (`periods`, `revenues`, `adminExpenses`, `salesCosts`, `personnelCosts`) ahora siguen `routes (declarativo) + controller + service + schema + repository`. La validación inline y los `res.status(404|400)` se eliminaron de las rutas; reglas como "monto/precio no negativo", "no encontrado" o los bucles `/import` viven en el service.
  - ✅ **ESLint + Prettier:** flat config (`eslint.config.mjs`) con `typescript-eslint` recommended + `eslint-config-prettier`. Scripts `lint`, `lint:fix`, `format`, `format:check`. `npm run lint` = 0 errores.
  - ✅ **Tests unitarios de servicios:** 6 suites / 27 tests (clients, users, periods, adminExpenses, revenues, personnelCosts) con `jest.mock` del repository. Verifican reglas de negocio (unicidad, NotFound, `/import` de revenues con todos los caminos de error, resiliencia per-row en personnelCosts). `coverageThreshold` inicial agregado.
  - ✅ **Contract tests:** helper `tests/helpers/api.ts` con `apiPath()` que usa `env.API_PREFIX`; tests existentes (auth, clients) ya no hardcodean el prefijo.
  - ✅ **Verificación:** `prisma generate && tsc` OK · `npm run lint` 0 errores · `npx jest tests/unit` 27/27 passing.
- **Documentación lista para desarrollo:**
  - ✅ `.ai/SPECIFICATION-SUMMARY.md` — Referencia técnica centralizada (campos, validaciones, endpoints)
  - ✅ Historias de usuario (Epic 00-03) con criterios de aceptación detallados
  - ✅ 25+ especificaciones de pantallas con layouts, validaciones, responsive
  - ✅ 25+ previews HTML interactivos (shadcn/ui + Tailwind)
  
- **Próximo paso:** 
  1. ✅ Schema PostgreSQL completado (`.ai/db/schema.md`) — 31 tablas, fuente de verdad: `schema.sql` + `data.sql` (en inglés, auditoría tiered)
  2. ✅ Schema SQL completo en `.ai/db/schema.sql` (fuente de verdad) + historial en `.ai/db/migrations/`
  3. ✅ Specification Summary completado (`.ai/SPECIFICATION-SUMMARY.md`)
  4. ✅ Contratos REST completados (`.ai/api/contracts-rol.md`) — 35+ endpoints con request/response/errores/validaciones
  5. ✅ Mocks JSON completados (`.ai/api/mocks/`) — 6 archivos: auth, time-entries, users, clients, projects, config
  6. ✅ Backend implementado (Node.js + Express + PostgreSQL + JWT) — `backend/src/`
  7. ✅ Frontend implementado (React + Vite + shadcn/ui + Tailwind) — `frontend/src/`
  8. ✅ Dependencias instaladas en backend y frontend

---

## Entidades principales

- **User** — Seeker, Gestor, Admin; pueden tener múltiples roles en múltiples proyectos
- **Client** — Clientes para los que se trabaja; pueden estar Activos o Inactivos
- **Project** — Proyectos de clientes; tienen usuarios asignados con roles
- **TimeEntry** — Registro de horas semanales (semana, proyecto, categoría, horas, extras, estado)
- **TimeEntryApproval** — Historial de aprobaciones/observaciones/rechazos por TimeEntry

---

## Infraestructura / Deploy

### Docker startup (backend)

El CMD del Dockerfile ejecuta en secuencia:
```
prisma migrate deploy → tsx prisma/seed.ts → node dist/index.js
```
- `tsx` se llama con ruta explícita (`node_modules/.bin/tsx`) — Prisma ejecuta el seed vía `sh -c` sin agregar `node_modules/.bin` al PATH.
- El seed es idempotente (`createMany skipDuplicates: true`) — re-runs seguros.
- El seed usa `PrismaPg` con `connectionString: process.env.DATABASE_URL` (mismo patrón que `src/shared/db/prisma.ts`). **No** usa `new PrismaClient()` sin adapter — Prisma 7 lo requiere.

### Nginx proxy (frontend)

`proxy_pass` **sin** trailing slash para preservar la URI completa:
```nginx
location /api/ {
    proxy_pass http://backend:3000;   # ← sin barra al final
```
Con barra (`proxy_pass http://backend:3000/`), Nginx reemplaza `/api/` por `/` y el backend recibe `/v1/auth/login` en lugar de `/api/v1/auth/login` → 404.

### Prisma client — import correcto

El generador `provider = "prisma-client"` (Prisma 7) no genera `index.ts`. Entry point es `client.ts`:
```typescript
import { PrismaClient } from '../src/generated/prisma/client';  // ✓
import { PrismaClient } from '../src/generated/prisma';          // ✗ MODULE_NOT_FOUND
```

---

## Decisiones de arquitectura

- **Autenticación:** JWT (stateless)
- **Sesiones:** Timeout a definir en código
- **Limpieza de BD (2026-05-18):** Se consolidó toda la BD en `.ai/db/schema.sql` (DDL) + `.ai/db/data.sql` (datos), reemplazando los `setup_*.sql` (legacy, pendientes de borrar). Tres pasadas: (1) **traducción** — todos los identificadores a inglés (`periodos→periods`, `ingresos→revenues`, `gastos_admin→admin_expenses`, `costos_venta→sales_costs`, `costos_por_persona→personnel_costs`, `tipos_documento→document_types`, `registros_comerciales→commercial_records`, `codigo→code`, `nombre→name`, `gestor_id→manager_id`, etc.; `ruc` se conserva; valores de datos quedan en español); (2) **auditoría tiered + renombres + PKs**; (3) **revert de layout** a inline terso. El backend aún usa los nombres viejos y se ajustará en un paso posterior (fuera de alcance de esta limpieza).
- **Renombrado de tablas:** `user_groups→profiles`, `user_areas→user_area`, `user_group_members→user_profile` (su FK `group_id→profile_id`), `project_project_categories→project_project_category`, `project_users→project_user`. Las 4 tablas puente perdieron el `id` UUID y usan **PK compuesta**.
- **Soft delete:** campo `is_active` (boolean, ex `enabled`). Las tablas con soft delete tienen además `deleted_at` y `deleted_by` (email del responsable).
- **Auditoría tiered:** bloque estándar al final de cada tabla = `created_at TIMESTAMP NOT NULL DEFAULT NOW()`, `created_by VARCHAR(50) NOT NULL DEFAULT 'admin'`, `updated_at TIMESTAMP` (nullable), `updated_by VARCHAR(50)`, `deleted_at`, `deleted_by`, `is_active BOOLEAN NOT NULL DEFAULT true`. **No todas** lo llevan completo: catálogos/entidades/transaccionales (24) sí; tablas puente solo `created_at`+`created_by`; `project_user` agrega `updated_*`+`is_active`; `time_entry_approvals` (log) solo `created_at`+`created_by`; `refresh_tokens`/`password_reset_tokens` sin bloque. `created_by`/`updated_by` guardan el **email** (o `'admin'` por defecto), sin FK. El JWT incluye `email` y se propaga route → service → data.
- **Email:** SMTP integrado con nodemailer (`emailService.js`). Dos tipos de email: bienvenida (link activación 48h) y reset de contraseña (link 1h). Si SMTP no está configurado, el link se imprime en consola (dev mode).
- **Activación de cuenta:** Nuevos usuarios no tienen contraseña. Al crearlos, se genera un token (tabla `password_reset_tokens`, válido 48h) y se envía email de bienvenida con link a `/activar-cuenta?token=...`. El endpoint de activación reutiliza `POST /api/auth/confirmar-reset`.
- **Acceso a proyectos del Gestor:** Un Gestor tiene acceso a todos los proyectos donde figura como `gestor_id` en la tabla `projects`, independientemente de si tiene fila en `project_users`. Esta regla aplica en tres puntos del backend: listar proyectos disponibles, verificar acceso al guardar horas, y listar time entries del panel. Los tres puntos fueron corregidos en `projectData.js` y `timeEntryData.js` (2026-04-24).
- **Áreas de usuario (M2M):** El campo `area_id` fue eliminado de `users`. Reemplazado por tabla `user_area` (M2M, ex `user_areas`, PK compuesta `(user_id, area_id)`). Un usuario debe tener al menos un área (validado en aplicación y route). El selector en UI es del mismo estilo toggle que los perfiles.
- **Área de proyecto (opcional):** Los proyectos tienen un campo `area_id` nullable. En UI se controla con un checkbox "Este proyecto aplica a un área específica" que habilita un Select para elegir el área. Si el checkbox está desmarcado, se envía `null`.
- **Proyecciones de horas:** Tabla `hour_projections`. El gestor registra rangos de horas proyectadas para un usuario en un proyecto (`start_date`, `end_date`, `projected_hours` en NUMERIC múltiplos de 0.5). `work_category_id` es FK opcional a `work_categories`. Alertas en Home del Gestor. Endpoint: `GET /projections/alertas`.
- **Módulo Finanzas:** Tablas `periods`, `revenues`, `admin_expenses`, `sales_costs`, `personnel_costs`. Los períodos son mensuales con estado abierto/cerrado (`is_closed`). Los ingresos se registran por (`project_id`, `period_id`). `personnel_costs` incluye `compensation`, `business_days` y `hours_per_day`.
- **Módulo Comercial:** Tablas `document_types` y `commercial_records`. Los registros comerciales vinculan propuestas/contratos a proyectos y responsables (`owner_id`), con `price`, `currency`, `document_type_id`, `has_contract` y `is_billed`.
- **Clientes — campo nombre eliminado:** El campo `nombre` fue eliminado de `clients`. `legal_name` (ex `razon_social`) es el identificador principal (NOT NULL). La FK `client_category_id` fue eliminada (migración 021).
- **Proyectos — descripcion eliminada:** El campo `descripcion` fue eliminado de `projects`. Se agregaron `actual_start_date` y `actual_end_date` (ex `fecha_inicio_real`/`fecha_fin_real`) para calcular desviaciones.
- **Context path / versionado de API (2026-05-20):** Todas las rutas de negocio se montan bajo `env.API_PREFIX` (default `/api/v1`, configurable por env — ej. `/seekops/api/v1` detrás de un gateway compartido). `/health` queda en la raíz por convención de operación. Frontend coordina con `VITE_API_URL || '/api/v1'`.
- **Patrón estándar de módulo (2026-05-20):** Todo módulo en `backend/src/modules/<dominio>/` sigue: `routes.ts` declarativo (middlewares + `ctrl.*`) → `controller.ts` (handlers finos `req → service → res`) → `service.ts` (reglas de negocio + errores semánticos) → `repository.ts` (acceso a Prisma) → `schema.ts` (Zod, solo si hay inputs) → `mapper.ts` (DB → DTO, solo si hay transformación). El `controller` y el `service` se omiten únicamente cuando no aportan (ej: GETs de catálogos sin lógica; pero hoy todos los módulos los tienen).
- **Jerarquía de errores (2026-05-20):** `AppError` con subclases `ValidationError(400)` — soporta `details: [{ field, message }]` — `UnauthorizedError(401)`, `ForbiddenError(403)`, `NotFoundError(404)`, `ConflictError(409)`. El `errorHandler` solo loguea 5xx + errores no operacionales. `notFoundHandler` para rutas inexistentes. Los servicios `throw` la subclase apropiada; las rutas no devuelven errores con `res.status(...).json(...)` directamente.
- **Aprobación por proyecto (2026-05-21):** La unidad de aprobación pasó de "semana completa" a **solicitud = (seeker × semana × proyecto)**. Cambios clave: (1) `time_entry_lines.status` (`PENDIENTE`/`APROBADO`/`APROBADO_CON_OBSERVACION`/`RECHAZADO`) es la fuente de verdad; `time_entries.status` es rollup derivado (precedencia: PENDIENTE > RECHAZADO > APROBADO_CON_OBSERVACION > APROBADO). (2) Las acciones approve/observe/reject reciben `proyecto_id` y operan sobre todas las líneas PENDIENTE de ese proyecto en la entrada. (3) No hay auto-aprobación para gestores: toda carga nace PENDIENTE. (4) El seeker no puede editar lo cargado; si le rechazan un proyecto puede re-cargarlo (nueva línea PENDIENTE, la rechazada queda `is_active=true`, `status=RECHAZADO`). (5) Guard de duplicados: dos índices parciales en `time_entry_lines` — `idx_tel_entry_project_no_category (time_entry_id, project_id) WHERE income_category_id IS NULL AND is_active AND status<>'RECHAZADO'` y `idx_tel_entry_project_with_category (time_entry_id, project_id, income_category_id) WHERE income_category_id IS NOT NULL AND is_active AND status<>'RECHAZADO'`. (6) `time_entry_approvals` gana `project_id` para auditoría. (7) Finanzas suma solo líneas `APROBADO`/`APROBADO_CON_OBSERVACION`. (8) `PUT /time-entries/:id` (ajustar) eliminado; `AjustarHoras.jsx` eliminado.
- **Consolidación income_categories → project_categories (2026-05-22):** Tabla `income_categories` eliminada (30 tablas en total, antes 31). `project_categories` ahora cubre ambos roles gracias a `is_area_type BOOLEAN DEFAULT false`. Los 5 codes con `is_area_type=true`: `RECLUTAMIENTO`, `CAPACITACION`, `COMERCIAL`, `AREA`, `CULTURA`. `time_entry_lines.income_category_id` FK apunta a `project_categories`. La ruta `GET /config/categorias-ingreso` fue eliminada; el frontend obtiene categorías desde `proyecto.categorias_ingreso` (incluido en la respuesta del listado de proyectos vía `project_project_category`).
- **Aprobación por categoría (2026-05-22):** Para proyectos de área, la unidad de aprobación es `(entry × project × income_category_id)`. Los schemas Zod de approve/observe/reject aceptan `categoria_ingreso_id?: string | null`. `recordApproval` en el repository filtra el `updateMany` por `income_category_id` cuando se provee. `HorasEquipo.jsx` genera una solicitud separada por cada combinación `(proyecto, categoría)` pendiente. Sin cambios en `time_entry_approvals` (el audit log sigue a nivel proyecto).

---

## Decisiones de UX

**12 flujos principales documentados** (ver `.ai/ux/flows/rol-flows.md`):

### Flujos Seeker (4):
- **F-01:** Autenticación y acceso (login)
- **F-02:** Cargar horas semanales (carga principal)
- **F-03:** Ajustar horas observadas (respuesta a observaciones)
- **F-04:** Ver historial y filtros (visualización de cargas)

### Flujos Gestor (3):
- **F-05:** Autenticación y acceso (login)
- **F-06:** Ver horas pendientes y aprobar/observar/rechazar
- **F-07:** Cargar horas propias (con auto-aprobación)

### Flujos Admin (5):
- **F-08:** Autenticación y acceso (login)
- **F-09:** Gestión de usuarios (CRUD)
- **F-10:** Gestión de clientes (CRUD)
- **F-11:** Gestión de proyectos (CRUD) y asignación de usuarios
- **F-12:** Ver, aprobar, observar, rechazar horas (como gestor global)
  
### Design System

Basado en shadcn/ui + Tailwind CSS. El preview aprobado en `.ai/preview/` es el contrato visual — el código debe coincidir exactamente.

| Token | Valor | Uso |
|-------|-------|-----|
| Primary | `#0f172a` (slate-900) | Botones, sidebar, links activos, logo |
| Background | `#f8fafc` (slate-50) | Fondo de todas las páginas |
| Card/Section | `#ffffff` | Fondo de cards y secciones |
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
- **Sidebar**: fondo `#0f172a`, texto blanco, ancho `224px` (w-56)
- **Contenido**: fondo `#f8fafc`, max-width 6xl, padding `1.5rem`
- **Cards/Sections**: fondo blanco, borde `#e2e8f0`, border-radius `0.75rem`, padding `1.5rem`
- **Login**: gradiente `135deg, #f8fafc → #f1f5f9`, logo box navy con "S" blanca

**Componentes disponibles:** Button, Input, Select, Dialog, Table, Badge, Alert, Card  
**Tipografía:** Inter, escala xs-2xl  
**Espaciado:** 4px grid, breakpoints sm: 640px / md: 768px / lg: 1024px

**Accesibilidad:** Focus rings visibles, contraste WCAG AA, labels asociados a inputs.

---

## Convenciones

### Idioma por capa

| Capa | Idioma | Ejemplos |
|------|--------|---------|
| Código (JS/TS): variables, funciones, clases, columnas SQL, rutas de API | **Inglés** | `userId`, `created_at`, `getProjects()`, `/api/time-entries` |
| Comentarios de código | **Inglés** | `// fetch active projects for current user` |
| Commits de git | **Español** | `feat: agregar endpoint de proyecciones` |
| Textos de UI (labels, mensajes, placeholders, títulos, botones) | **Español latinoamericano — variante Perú** | `Ingresa tu contraseña`, `Selecciona un proyecto` |

**Regla de oro:** si lo ve el usuario en pantalla → español peruano. Si lo lee el desarrollador en el código → inglés.

### Estilo de nombres en código

- **JS/TS:** camelCase (`userId`, `getProjects`)
- **SQL:** snake_case (`user_id`, `created_at`)
- **Variables de entorno:** SCREAMING_SNAKE_CASE (`DB_HOST`, `JWT_SECRET`)

### Copy (textos de UI)

- **Variedad de español:** Español latinoamericano, variante Perú.
- **Tratamiento al usuario:** Tuteo (`tú`). **No usar voseo rioplatense** (sin "Ingresá", "Seleccioná", "tenés", "podés", etc.).
- **Forma correcta para imperativos:**
  - ✅ `Ingresa`, `Registra`, `Selecciona`, `Establece`, `Completa`, `Define`, `Crea`, `Aprueba`, `Rechaza`
  - ❌ `Ingresá`, `Registrá`, `Seleccioná`, `Establecé`, `Completá`, `Definí`, `Creá`, `Aprobá`, `Rechazá`
- **Conjugaciones de segunda persona:**
  - ✅ `tienes`, `puedes`, `crees`
  - ❌ `tenés`, `podés`, `creés`
- **Vocabulario preferido:**
  - `enlace` en lugar de `link` para contextos formales
  - `restablecer` en lugar de `resetear`
  - `Inténtalo de nuevo` en lugar de `Intentá de nuevo`

---

## Decisiones de producto

- **Período retroactivo:** Sin límite — seekers pueden cargar horas de cualquier semana
- **Auditoria:** Se registra quién cambió qué y cuándo en cada TimeEntry
- **Notificaciones:** Email automático en eventos (aprobación, observación, ajustes, rechazo)
- **Auto-aprobación:** Gestor se auto-aprueba cuando carga horas en su propio proyecto (permitido)
- **Múltiples roles:** Un usuario puede ser Seeker en Proyecto A y Gestor en B (incluso ambos en C)
- **Horas rechazadas:** Definitivas — se visualizan sin opción de editar, nueva carga es entrada nueva
- **Aprobación:** No reversible — una vez aprobada, no se puede desaprobar

---

## Historias de Usuario

**Total:** 30 historias ✅

- **Epic 00 — General (5):** Login, Reset password, Home Seeker, Home Gestor, Home Admin
- **Epic 01 — Seeker (4):** Registrar horas, Ver historial, Ajustar observadas, **Alerta semanas sin carga (US-004)**
- **Epic 02 — Gestor (6):** Ver pendientes (US-201), Aprobar (US-005), Observar (US-006), Rechazar (US-007), Propias horas (US-008), **Proyecciones de horas (US-209)**
- **Epic 03 — Admin (8):** Crear usuario, Crear cliente, Crear proyecto, Asignar usuarios, Editar usuario, Editar cliente, Editar proyecto, Administración de permisos/roles
- **Epic 04 — Finanzas y Comercial (7):** Gestionar períodos (US-401), Registrar ingresos (US-402), Gastos administrativos (US-403), Costos de venta (US-404), Costos por persona (US-405), Registros comerciales (US-406), Tipos de documento (US-407)

Ver: `.ai/stories/README.md`

---

## Archivos de referencia

| Archivo | Contenido |
|---------|-----------|
| `.ai/brief.md` | Brief completo del producto ✅ |
| `.ai/stories/README.md` | Índice de 30 historias de usuario ✅ |
| `.ai/stories/epic-00-general.md` | Historias transversales ✅ |
| `.ai/stories/epic-01-seeker.md` | Historias Seeker ✅ |
| `.ai/stories/epic-02-gestor.md` | Historias Gestor ✅ |
| `.ai/stories/epic-03-admin.md` | Historias Admin ✅ |
| `.ai/stories/epic-04-finanzas.md` | Historias Finanzas y Comercial ✅ |
| `.ai/ux/design-system.md` | Design System (shadcn/ui) ✅ |
| `.ai/ux/flows/rol-flows.md` | 12 flujos UX detallados (Seeker 4, Gestor 3, Admin 5) ✅ |
| `.ai/ux/screens/` | 20+ especificaciones de pantallas completadas ✅ |
| `.ai/preview/index.html` | Índice central de todos los previews |
| `.ai/preview/s00-login.html` | Preview interactivo del login |
| `.ai/preview/s00-recuperar-contrasena.html` | Preview interactivo de recuperación |
| `.ai/preview/s01-home-seeker.html` | Preview interactivo del home Seeker |
| `.ai/preview/s01-cargar-horas.html` | Preview interactivo del formulario de carga |
| `.ai/SPECIFICATION-SUMMARY.md` | Referencia técnica centralizada (campos, validaciones, endpoints, estados) |
| `.ai/api/contracts-rol.md` | Contratos REST con request/response/errores ✅ (35+ endpoints) |
| `.ai/api/mocks/auth.json` | Mocks de autenticación ✅ |
| `.ai/api/mocks/time-entries.json` | Mocks de registros de horas ✅ |
| `.ai/api/mocks/users.json` | Mocks de usuarios ✅ |
| `.ai/api/mocks/clients.json` | Mocks de clientes ✅ |
| `.ai/api/mocks/projects.json` | Mocks de proyectos ✅ |
| `.ai/api/mocks/config.json` | Mocks de tablas de configuración/lookup ✅ |
| `backend/prisma/schema.prisma` | **Fuente de verdad del schema** — editar aquí, luego `prisma migrate dev` |
| `backend/prisma/migrations/` | Historial de migraciones generadas por Prisma |
| `backend/prisma/seed.ts` | Seeds iniciales (catálogos + usuario admin) |
| `.ai/db/schema.sql` | Referencia histórica del DDL original (solo lectura) |
| `.ai/db/data.sql` | Origen de los datos iniciales; trasladado a `prisma/seed.ts` |
| `.ai/db/schema.md` | Documentación del schema (mantener actualizada con `schema.prisma`) |
| `.ai/db/migrations_archive/` | Historial de migraciones incrementales (001 en adelante) |
| `.ai/pendientes.md` | Decisiones bloqueantes (8 cerradas ✅) |
| `WORKFLOW.md` | Checklist por etapa |

---

