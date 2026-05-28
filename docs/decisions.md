# Registro de decisiones — Seekops

> Historial cronológico de decisiones de arquitectura, BD y producto (estilo ADR ligero).
> El **estado vigente** vive en [`context.md`](context.md); este archivo conserva la *traza* de cómo se llegó ahí.
> Entradas marcadas `[SUPERSEDIDA]` describen un modelo que ya fue reemplazado — se conservan solo como contexto histórico.
>
> Orden: más reciente arriba.

---

## 2026-05-27 — Módulo `dashboard` (API de integración externa)

Nuevo módulo paraguas `apps/api/src/modules/dashboard/` que migra la "API Dashboard" de v1: endpoints **read-only, abiertos (sin auth), sin paginación, array plano** que alimentan BI. Sigue el patrón de sub-módulos de `finance/`: `dashboard.routes.ts` monta un sub-router por recurso.

**Decisiones clave:**
- **Excepción consciente al contrato en español:** este módulo expone **claves en inglés** heredadas de v1 para preservar compatibilidad byte-a-byte con el consumidor BI. La traducción v2→v1 vive en el `mapper` de cada sub-recurso. Es la única excepción a la convención de claves JSON en español.
- **Hook de auth futuro:** cuando se agregue (token compartido estilo `require_token(?token=...)` de v1), se monta como un único `router.use(...)` sin tocar los sub-recursos.
- **Repository propio read-only** por recurso; no reusa el `service`/`mapper` de los módulos de negocio (aislamiento de contrato).

**4 recursos migrados** (todos abiertos, array plano desnormalizado con claves `__` de v1):
- `GET /api/dashboard/seekers` — = `User.objects.all()` de v1. Traduce `position→job`, `mobile_phone→cellphone`, `teams.name→team`.
- `GET /api/dashboard/clients` — `business_reason=legal_name`, `business_name=trade_name`, `business_number=ruc`, `fiscal_address=address`, `legal_address=null`, `segmentation`/`sector` como UUID v2.
- `GET /api/dashboard/commercial` — `record_date→date`, `currency→coin`, `has_contract→status`, `is_billed→billing`, `owner→responsible__*`, `document_types.name→document`. Gaps en `null`: `type`, `division__name` (v2 no tiene divisions), `duration`.
- `GET /api/dashboard/project` — traduce `actual_start_date→real_start_date`, `actual_end_date→real_end_date`; desnormaliza cliente/manager/`productivity_layers.name`; gaps de v2 en `null` (status, tier, evaluation_*, image, flag_poll, comments_date, categorías Q2/Q3 diferidas).

---

## 2026-05-26 — Approvals como fuente de verdad única `[VIGENTE]`

**Reemplaza el modelo de "Aprobación por proyecto" del 2026-05-21.** Se eliminó el estado de semana y el estado por línea: `time_entries` y `time_entry_lines` ya **no** tienen columna `status`.

`time_entry_approvals` es la única fuente de verdad del estado de aprobación:
- Una fila por línea (`time_entry_line_id` UNIQUE), creada en `PENDIENTE` al cargar el seeker.
- El gestor la muta a `APROBADO | APROBADO_CON_OBSERVACION | RECHAZADO`.
- Al aprobar con observación, las horas sugeridas van solo a `suggested_hours`/`suggested_extra_hours`; las `time_entry_lines.hours` **nunca** se modifican.

**Horas efectivas:** `APROBADO_CON_OBSERVACION` → sugeridas; `APROBADO` → cargadas; `PENDIENTE`/`RECHAZADO` → 0 (no cuentan en totales).

**UI:** el badge de estado de semana se eliminó de toda la UI; cada pantalla muestra el bloque de semana con proyectos + estados desplegables. En los payloads de approve/observe/reject, `linea_id` reemplaza a `categoria_ingreso_id`.

Migración: `approvals_as_source_of_truth`.

---

## 2026-05-25 — Semana como rango de fechas

Se eliminó el código string `"S21/26"` como identidad temporal de `time_entries`. La columna `week VARCHAR(10)` se reemplazó por `week_start_date DATE` (lunes) + `week_end_date DATE` (domingo), con `UNIQUE(user_id, week_start_date)`.

**Motivo:** existían **tres algoritmos divergentes** para mapear fecha↔código (`calcularCodigoSemana`/`formatearSemana` calendario, `semanaADomingo`, y el parse SQL `to_date(...'IYYYIW')` ISO) que discrepaban en los límites de año.

**Cambios:**
- API — `time_entries` expone `semana_inicio`/`semana_fin` (ISO `YYYY-MM-DD`); el POST recibe ambos (valida lunes y fin = inicio+6); filtro `?semana_inicio=`.
- `semanas-sin-carga` devuelve `{ semanas: [{semana_inicio, semana_fin}], total }`.
- Las queries SQL de alertas (`projections.repository`) y horas usadas (`personnelCosts.repository`) ya no parsean strings: comparan rangos directamente / `EXTRACT` sobre `week_start_date`.
- Frontend — se eliminaron `formatearSemana`/`semanaADomingo`; nuevo helper `rangoSemana(inicioISO)`; la UI muestra **solo el rango** ("Lun 18 al Dom 24 may 2026"), sin número de semana.
- Migración limpia (sin backfill, dev).

---

## 2026-05-22 — Consolidación `income_categories` → `project_categories`

Tabla `income_categories` eliminada. `project_categories` ahora cubre ambos roles gracias a `is_area_type BOOLEAN DEFAULT false`. Los 5 codes con `is_area_type=true`: `RECLUTAMIENTO`, `CAPACITACION`, `COMERCIAL`, `AREA`, `CULTURA`.

- `time_entry_lines.income_category_id` FK ahora apunta a `project_categories`.
- Ruta `GET /config/categorias-ingreso` eliminada; el frontend obtiene categorías desde `proyecto.categorias_ingreso` (incluido en el listado de proyectos vía `project_project_category`).
- Proyectos de área: el seeker solo ve las categorías asignadas al proyecto, con tipo área.

---

## 2026-05-22 — Aprobación por categoría

Para proyectos de área, la unidad de aprobación es `(entry × project × income_category_id)`. Los schemas Zod de approve/observe/reject aceptan `categoria_ingreso_id?: string | null`; `recordApproval` filtra el `updateMany` por `income_category_id` cuando se provee. `HorasEquipo.jsx` genera una solicitud separada por cada combinación `(proyecto, categoría)` pendiente.

> Nota: la mecánica de payload por categoría fue revisada por la decisión del 2026-05-26 (ahora `linea_id`), pero la *unidad de aprobación por categoría para proyectos de área* sigue vigente.

---

## 2026-05-21 — Aprobación por proyecto `[SUPERSEDIDA por 2026-05-26]`

> Conservada solo como contexto histórico. El modelo vigente es "Approvals como fuente de verdad única".

La unidad de aprobación pasó de "semana completa" a **(seeker × semana × proyecto)**. En ese diseño:
- `time_entry_lines.status` era la fuente de verdad; `time_entries.status` era rollup derivado.
- approve/observe/reject recibían `proyecto_id` y operaban sobre las líneas PENDIENTE de ese proyecto.
- Sin auto-aprobación para gestores: toda carga nacía PENDIENTE.
- El seeker no podía editar; si le rechazaban un proyecto, re-cargaba (nueva línea PENDIENTE).
- `PUT /time-entries/:id` (ajustar) eliminado; `AjustarHoras.jsx` eliminado.

---

## 2026-05-20 — Calidad y consistencia backend

- **Context path / versionado API:** todas las rutas de negocio bajo `env.API_PREFIX` (default `/api/v1`). `/health` queda fuera del prefijo (path estable para load balancers).
- **Jerarquía de errores semántica:** `AppError` + subclases `ValidationError(400, details?)`, `UnauthorizedError(401)`, `ForbiddenError(403)`, `NotFoundError(404)`, `ConflictError(409)`. `errorHandler` solo loguea 5xx + no operacionales; `notFoundHandler` para rutas inexistentes. ~40 `throw new AppError(...)` migrados a subclases.
- **Validación completa:** `validateParams` agregado; los validators devuelven todos los issues de Zod como `details: [{ field, message }]`. `IdParamSchema` en `shared/schemas/common.ts`.
- **Patrón estándar aplicado a TODOS los módulos:** `routes` declarativo + `controller` + `service` + `schema` + `repository`. La validación inline y los `res.status(...)` se eliminaron de las rutas.
- **ESLint + Prettier:** flat config con `typescript-eslint` + `eslint-config-prettier`. `npm run lint` = 0 errores.
- **Tests unitarios:** 6 suites / 27 tests con `jest.mock` del repository. Contract tests con helper `apiPath()`.

---

## 2026-05-19 — Refactor backend: TypeScript + Prisma + modular

- Migración completa JS → **TypeScript strict** (`allowJs: false`, `tsc --noEmit` sin errores).
- **Prisma 7** como ORM (bootstrap por `db pull` + baseline `0_init`). La fuente de verdad de la BD pasa a `prisma/schema.prisma` + `prisma/migrations/`.
- Arquitectura **modular por dominio**: `src/modules/<dominio>/{routes,controller,service,repository,mapper,schema}` + `src/shared/{db,config,http,middlewares,services}`.
- Validación con **Zod** (reemplaza express-validator).
- Contrato API congelado: claves JSON en español vía mapper; status codes y formato `{ error }` invariantes.
- Paths anglicizados: `/periodos→/periods`, `/ingresos→/revenues`, `/gastos-admin→/admin-expenses`, etc.; verbos `/aprobar→/approve`, `/observar→/observe`, `/rechazar→/reject`.
- Impacto frontend: solo `apps/ui/src/services/api.js`.
- Módulos migrados: clients, config, users, projects, timeEntries, projections, finance (periods, revenues, adminExpenses, salesCosts, personnelCosts), commercial, auth.

### Adaptación backend al schema en inglés (mismo día)
Backend alineado con identificadores en inglés. La capa API/DTO se mantiene en español vía alias SQL (`first_name AS nombres`) y claves `datos.*`. Verificado end-to-end con docker-compose (db+backend+frontend).

---

## 2026-05-18 — Limpieza y consolidación de BD

Se consolidó toda la BD en `schema.sql` (DDL) + `seeds.sql` (datos), reemplazando los `setup_*.sql` legacy. Tres pasadas:
1. **Traducción** — todos los identificadores a inglés (`periodos→periods`, `gestor_id→manager_id`, `codigo→code`, `nombre→name`, etc.; `ruc` se conserva; valores de datos quedan en español).
2. **Auditoría tiered + renombres + PKs compuestas** en tablas puente.
3. **Revert de layout** a inline terso.

Renombrado de tablas: `user_groups→profiles`, `user_areas→user_area`, `user_group_members→user_profile`, `project_project_categories→project_project_category`, `project_users→project_user`. Las 4 tablas puente perdieron el `id` UUID y usan **PK compuesta**.

---

## 2026-04-24 — Acceso a proyectos del Gestor (bugs de testing)

Un Gestor tiene acceso a todos los proyectos donde figura como `manager_id` en `projects`, independientemente de si tiene fila en `project_user`. Tres bugs corregidos:
- `projectData.listarProyectos`: faltaba `OR p.gestor_id = usuario` → gestor no veía sus proyectos en el combo.
- `timeEntryData.verificarProyectoAsignado`: misma causa, gestor no podía guardar horas → UNION con `projects WHERE gestor_id`.
- `timeEntryData.listarEntradas`: usaba `te.usuario_id` (columna inexistente) → corregido a `te.user_id`.
