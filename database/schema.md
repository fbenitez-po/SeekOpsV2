# Schema de Base de Datos — Seekops

> Documento **conceptual**: relaciones, convenciones y decisiones de diseño.
> **Fuente de verdad canónica:** `backend/prisma/schema.prisma` + `backend/prisma/migrations/` — es lo que construye y migra la BD vía `prisma migrate`.
> **Espejos SQL** (deben mantenerse sincronizados con Prisma en el mismo cambio; si divergen, manda Prisma):
> · `database/schema.sql` — DDL completo en un único script para crear la BD entera de una vez (bootstrap de dev).
> · `database/seeds.sql` — datos iniciales/catálogos (espejo de `seed.ts`).
> · `database/legacy-migration/legacy-migration.sql` — migración de datos v1→v2.
> Identificadores en inglés · Auditoría tiered · Tablas puente con PK compuesta.
> **Última actualización:** 28 de Mayo 2026

---

## Diagrama ER Simplificado

```
┌──────────────────────────────────────────────────────────────┐
│                        CONFIGURACIÓN                          │
├──────────────────────────────────────────────────────────────┤
│ work_categories     client_segmentations  client_sectors      │
│ service_types       project_segmentation  project_categories  │
│ productivity_layers teams   areas          document_types      │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                        ENTIDADES CORE                         │
├──────────────────────────────────────────────────────────────┤
│  users ──→ team_id → teams                                    │
│    ├─→ user_area (M:N → areas)                                │
│    ├─→ user_profile (M:N → profiles)                          │
│    └─→ project_user (M:N → projects, con role)                │
│                                                               │
│  clients → projects → project_user → users                    │
│              ├─→ project_project_category → project_categories │
│              ├─→ time_entries → time_entry_lines              │
│              │                    └─1:1→ time_entry_approvals  │
│              ├─→ hour_projections                             │
│              ├─→ revenues                                     │
│              └─→ commercial_records                           │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                    FINANZAS / PERÍODOS                        │
├──────────────────────────────────────────────────────────────┤
│  periods → revenues (project_id, period_id)                   │
│         → admin_expenses · sales_costs                        │
│         → personnel_costs (user_id, period_id)                │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                      COMERCIAL                                │
├──────────────────────────────────────────────────────────────┤
│  document_types ← commercial_records → projects, users        │
└──────────────────────────────────────────────────────────────┘
```

---

## Auditoría tiered (convención global)

Bloque estándar al final de cada tabla, en orden: `created_at`, `created_by`, `updated_at`, `updated_by`, `deleted_at`, `deleted_by`, `is_active`. No todas las tablas lo llevan completo.

| Tier | Tablas | Campos de auditoría |
|------|--------|---------------------|
| **Completo** (7 campos) | 10 catálogos + `users`, `profiles`, `clients`, `projects`, `time_entries`, `time_entry_lines`, `hour_projections`, `periods`, `revenues`, `admin_expenses`, `sales_costs`, `personnel_costs`, `commercial_records` | bloque completo |
| **Puente mínimo** | `user_area`, `user_profile`, `project_project_category` | solo `created_at`, `created_by` |
| **Puente con estado** | `project_user` | `created_at`, `created_by`, `updated_at`, `updated_by`, `is_active` |
| **Approval 1:1** | `time_entry_approvals` | `created_at`, `created_by` (carga) + `reviewed_by`, `reviewed_at` (acción gestor) |
| **Sin bloque** | `refresh_tokens`, `password_reset_tokens` | solo su `created_at` propio |

`created_by` / `updated_by` / `deleted_by` guardan el **email** del responsable (o `'admin'` por defecto), `VARCHAR(50)`, sin FK. `updated_at` es nullable (sin default).

---

## Catálogos de Configuración

Las 10 tablas de catálogo comparten estructura base (`id`, `code` UNIQUE, `name`, `description`, auditoría completa). `project_categories` agrega `is_area_type`. `document_types` no tiene `code` (solo `name` UNIQUE).

| Tabla | Descripción | Seeds |
|-------|-------------|-------|
| `work_categories` | Tipos de trabajo (FK desde `hour_projections.work_category_id`) | 18: ESTRATEGIA, GESTORES_GESTION, UX_RESEARCH, UI, DEV_FRONTEND, SEO, DEV_BACKEND, DEV_QA, UX_PROTOTYPE, DISENIO_SOCIAL_MEDIA, APOYO, UI_PROTOTYPE, UX_TESTING, LIDERES_GESTION, PRODUCT_MANAGEMENT, CAPACITACIONES, PROPUESTAS_COMERCIALES, RECLUTAMIENTO |
| `service_types` | Tipos de servicio del proyecto | PROYECTO, SERVICIO_RECURRENTE |
| `client_segmentations` | Segmentación comercial del cliente | 7: CUENTA_CLAVE, CUENTA_INTERNACIONAL, CUENTA_DESARROLLO, CUENTA_CASUAL, CUENTA_INACTIVA, CUENTA_EXCLUIDA, NUEVOS_CLIENTES |
| `client_sectors` | Sector económico del cliente | 33: CONSULTORIA, BANCA_FINANCIERO, TECNOLOGIA, … BELLEZA |
| `project_segmentation` | Segmentación del proyecto | 8: I001…I008 |
| `project_categories` | Categorías del proyecto (multi-select vía `project_project_category`). Las de `is_area_type=true` son las únicas válidas para proyectos de área en `time_entry_lines` | 35 total: 30 normales + 5 de área (`is_area_type=true`): RECLUTAMIENTO, CAPACITACION, COMERCIAL, AREA, CULTURA |
| `productivity_layers` | Capa de productividad del proyecto | OPERATIONAL_BACKBONE, CULTURE_BUILDERS, GROWTH_LEAPS |
| `teams` | Equipos de trabajo | 13: UI, UX, BRANDING, CLIENTE, DIRECTOR, SEO, OUTSOURCING, ADMINISTRATIVO, SOCIAL_MEDIA, ESTRATEGIA, PRODUCTO, DISENIO_EXPERIENCIA, TECNOLOGIA |
| `areas` | Áreas funcionales de la empresa | 8: TALENTO_CULTURA, COMERCIAL, PRODUCTO, TECNOLOGIA, ESTRATEGIA, ADMINISTRACION, DISENIO_EXPERIENCIA, OUTSOURCING |
| `document_types` | Tipos de documento comercial (catálogo de Comercial) | Orden de Compra, Contrato, Propuesta, Addendum, Carta de Intención, Factura Proforma, Otro |

> **Nota (2026-05-22):** `income_categories` fue **eliminada**. Sus 5 categorías de área se absorbieron en `project_categories` vía el flag `is_area_type = true`. El total de tablas pasó de 31 a **30**.

---

## Entidades Core

| Tabla | Descripción | Notas clave |
|-------|-------------|-------------|
| `users` | Usuarios del sistema (Seekers, Gestores, Admins). Soft delete con `is_active`. | Sin `area_id` (áreas vía `user_area`). `email` y `document_number` UNIQUE. `team_id`, `document_number`, `position`, `hire_date` son **nullable**. `is_staff`/`is_superuser` = booleanos de negocio. |
| `profiles` | Perfiles / grupos de permisos (ex `user_groups`). | Seeds: ADMIN, SEEKER, GESTOR. |
| `clients` | Clientes para los que se trabaja. Soft delete. | `legal_name` (ex `razon_social`) es el identificador principal (NOT NULL). `segmentation_id` obligatorio; `sector_id` nullable. `ruc` UNIQUE. |
| `projects` | Proyectos de clientes. Soft delete. | `client_id` obligatorio. `project_segmentation_id`, `productivity_layer_id`, `service_type_id`, `area_id`, `manager_id` son **nullable**. `actual_start_date`/`actual_end_date` para desviaciones. CHECK: `end_date >= start_date`. |

---

## Tablas Puente (PK compuesta, sin `id`)

| Tabla | PK | Descripción |
|-------|----|-------------|
| `user_area` | `(user_id, area_id)` | Áreas asignadas al usuario. Un usuario debe tener al menos un área. |
| `user_profile` | `(user_id, profile_id)` | Perfiles de un usuario (ex `user_group_members`). |
| `project_project_category` | `(project_id, project_category_id)` | Categorías de un proyecto (multi-select). |
| `project_user` | `(project_id, user_id, role)` | Usuarios asignados a un proyecto con su `role`. Conserva `is_active` + `updated_*` (estado de la asignación). |

---

## Tablas Transaccionales

| Tabla | Descripción | Notas clave |
|-------|-------------|-------------|
| `time_entries` | Cabecera de registro semanal de horas. Un registro por (usuario, semana). | Semana identificada por rango de fechas `week_start_date` (lunes) / `week_end_date` (domingo), no por código string. **Sin `status`** (el estado vive en `time_entry_approvals`). UNIQUE `(user_id, week_start_date)`. |
| `time_entry_lines` | Registro **inmutable** de lo que cargó el seeker. Una línea por proyecto+categoría. | `hours`/`extra_hours` NUMERIC con múltiplos de 0.5 (CHECK; `extra_hours` ≤ 8). **Sin `status`/`reviewed_*`**. `income_category_id` → `project_categories` (nullable, solo proyectos de área). |
| `time_entry_approvals` | **Fuente de verdad del estado de revisión.** Una fila 1:1 por línea (`time_entry_line_id` UNIQUE), creada `PENDIENTE` al cargar; el gestor la muta. | Estados: `PENDIENTE \| APROBADO \| APROBADO_CON_OBSERVACION \| RECHAZADO`. `comment` = texto libre unificado (observación o motivo de rechazo). `suggested_hours`/`suggested_extra_hours` solo en `APROBADO_CON_OBSERVACION`. |
| `hour_projections` | Proyecciones de horas del gestor para un usuario en un proyecto. | `projected_hours` NUMERIC(8,1) múltiplos de 0.5 (CHECK). `work_category_id` nullable. CHECK: `end_date >= start_date`. |
| `refresh_tokens` | Tokens de sesión (1:1 con usuario). | Sin bloque de auditoría. |
| `password_reset_tokens` | Tokens de recuperación de contraseña (1:1 con usuario). | Sin bloque de auditoría. |

---

## Finanzas — Períodos

| Tabla | Descripción | Notas clave |
|-------|-------------|-------------|
| `periods` | Períodos mensuales con estado abierto/cerrado (`is_closed`). | UNIQUE `(month, year)`. CHECK: mes 1–12, año ≥ 2020. Seed: Jan 2026 → May 2028; Jan–Mar 2026 cerrados. |
| `revenues` | Ingresos por proyecto y período (ex `ingresos`). | UNIQUE `(project_id, period_id)`. CHECK: `amount >= 0`. |
| `admin_expenses` | Gastos administrativos (ex `gastos_admin`). | Múltiples líneas por período con `code` libre. CHECK: `amount >= 0`. |
| `sales_costs` | Costos de venta (ex `costos_venta`). Estructura idéntica a `admin_expenses`. | CHECK: `amount >= 0`. |
| `personnel_costs` | Remuneración por persona por período (ex `costos_por_persona`). | UNIQUE `(period_id, user_id)`. CHECK: `compensation >= 0`, `business_days > 0`, `hours_per_day > 0`. |

---

## Comercial

| Tabla | Descripción | Notas clave |
|-------|-------------|-------------|
| `commercial_records` | Registros comerciales (propuestas, contratos) vinculados a proyectos (ex `registros_comerciales`). | `owner_id` (ex `responsable_id`), `has_contract` (ex `estado_contrato`), `is_billed` (ex `facturacion`). `document_type_id` nullable. CHECK: `price >= 0`. |

---

## Relaciones (Resumen)

| Tabla A | Relación | Tabla B | Implementación |
|---------|----------|---------|----------------|
| users | N:0..1 | teams | FK team_id (nullable) |
| users | M:N | areas | via user_area |
| users | M:N | profiles | via user_profile |
| users | M:N | projects | via project_user (con role) |
| users | 1:N | projects | FK manager_id (nullable) |
| users | 1:N | time_entries | FK user_id |
| users | 1:N | personnel_costs | FK user_id |
| clients | N:1 | client_segmentations | FK segmentation_id |
| clients | N:0..1 | client_sectors | FK sector_id (nullable) |
| clients | 1:N | projects | FK client_id |
| projects | N:0..1 | project_segmentation | FK project_segmentation_id (nullable) |
| projects | N:0..1 | productivity_layers | FK productivity_layer_id (nullable) |
| projects | N:0..1 | service_types | FK service_type_id (nullable) |
| projects | N:0..1 | areas | FK area_id (nullable) |
| projects | M:N | project_categories | via project_project_category |
| projects | 1:N | hour_projections | FK project_id |
| projects | 1:N | revenues | FK project_id |
| projects | 1:N | commercial_records | FK project_id |
| time_entries | 1:N | time_entry_lines | FK time_entry_id |
| time_entry_lines | 1:1 | time_entry_approvals | FK time_entry_line_id (UNIQUE) |
| time_entry_lines | N:0..1 | project_categories | FK income_category_id (nullable; solo proyectos de área) |
| hour_projections | N:0..1 | work_categories | FK work_category_id (nullable) |
| periods | 1:N | revenues / admin_expenses / sales_costs / personnel_costs | FK period_id |
| document_types | 1:N | commercial_records | FK document_type_id (nullable) |

> `created_by` / `updated_by` / `deleted_by` son `VARCHAR(50)` (email, o `'admin'`). No son FK — no aparecen aquí.

---

## Decisiones de Diseño

### Identificadores en inglés
Todos los nombres de tablas/columnas/constraints/índices están en inglés (limpieza 2026-05-18). Los **valores** de datos pueden quedar en español (contenido de negocio: `'PENDIENTE'`, nombres de catálogos). `ruc` se conserva (término tributario local).

### UUIDs como Primary Keys
Entidades, catálogos y transaccionales usan UUID (`gen_random_uuid()`). Las 4 tablas puente **no** tienen `id` surrogate: PK compuesta.

### Soft Deletes
Campo `is_active` (boolean). Queries filtran `WHERE is_active = true`. Las tablas con soft delete completo agregan `deleted_at` y `deleted_by`.

### Horas en NUMERIC
`hours`, `extra_hours` y `projected_hours` son `NUMERIC` para soportar medias horas. CHECK constraints exigen múltiplos de 0.5.

### area_id en projects es nullable
Proyectos pueden o no pertenecer a un área (la UI lo controla con un checkbox).

### time_entry_approvals como fuente de verdad (2026-05-26, simplificado 2026-05-27)
Una fila por línea (`time_entry_line_id` UNIQUE), creada `PENDIENTE` al cargar. El gestor la muta al estado terminal. Las horas sugeridas van a `suggested_hours`/`suggested_extra_hours` — **nunca** modifican `time_entry_lines` (inmutable). Si se rechaza, el seeker re-carga: se crea un par nuevo (línea + approval `PENDIENTE`); la vieja queda como histórico. `comment` porta el texto libre del gestor en cualquier acción. `time_entry_id`, `rejection_reason` y `can_resubmit` fueron eliminados por redundantes (alcanzables vía la línea o derivables del estado `RECHAZADO`).

### Acceso del Gestor a proyectos
Un Gestor tiene acceso a todos los proyectos donde figura como `manager_id`, independientemente de si tiene fila en `project_user`. Validado en tres puntos del backend.

### Renombrados históricos (2026-05-18 a 2026-05-22)
`user_groups→profiles`, `user_areas→user_area`, `user_group_members→user_profile` (`group_id→profile_id`), `project_project_categories→project_project_category`, `project_users→project_user`, `periodos→periods`, `ingresos→revenues`, `gastos_admin→admin_expenses`, `costos_venta→sales_costs`, `costos_por_persona→personnel_costs`, `tipos_documento→document_types`, `registros_comerciales→commercial_records`, `client_categories→work_categories`.

---

## Resumen de Tablas (30 total)

| Grupo | # | Tablas |
|-------|---|--------|
| Catálogos | 10 | work_categories, service_types, client_segmentations, client_sectors, project_segmentation, project_categories, productivity_layers, teams, areas, document_types |
| Core | 4 | users, profiles, clients, projects |
| Puente | 4 | user_area, user_profile, project_project_category, project_user |
| Transaccional | 6 | time_entries, time_entry_lines, time_entry_approvals, refresh_tokens, password_reset_tokens, hour_projections |
| Finanzas | 5 | periods, revenues, admin_expenses, sales_costs, personnel_costs |
| Comercial | 1 | commercial_records |

> `document_types` se cuenta como catálogo (lo usa Comercial).

---

## Archivos y Workflow

El schema tiene **doble fuente de verdad** que debe mantenerse equivalente: el script unificado `database/schema.sql` y el par Prisma `schema.prisma` + `migrations/`. Cualquier cambio de schema debe reflejarse en **ambos**.

| Archivo | Rol |
|---------|-----|
| **`database/schema.sql`** | DDL unificado: crea la BD completa (30 tablas, índices, constraints, CHECKs) en una sola corrida, en cualquier ambiente. Estructura exacta de referencia. |
| **`database/seeds.sql`** | Datos iniciales para correr junto al script unificado (catálogos, períodos, admin). |
| **`backend/prisma/schema.prisma`** | Schema de Prisma para trabajo local. Editar aquí, luego `prisma migrate dev`. |
| **`backend/prisma/migrations/`** | Historial generado por Prisma. No editar manualmente. |
| **`backend/prisma/seed.ts`** | Datos iniciales vía Prisma. `prisma db seed` / `prisma migrate reset`. |

### Al cambiar el schema (mantener ambos en sync)
1. Editar `backend/prisma/schema.prisma` y correr `prisma migrate dev --name <descripcion>`.
2. Replicar el mismo cambio en `database/schema.sql` (y en `seeds.sql` si aplica).
3. Actualizar este documento si cambian relaciones, convenciones o decisiones.

> **Gap conocido — CHECK constraints:** los CHECK documentados aquí (múltiplos de 0.5, `amount >= 0`, rangos de fechas) están en `database/schema.sql`, pero Prisma no los expresa de forma declarativa y **no se generan en las migraciones**. Una BD levantada desde Prisma no los tendrá hasta agregarlos vía SQL crudo en una migración. Esto rompe la equivalencia entre ambas fuentes.

| Situación | Levantar con schema.sql | Levantar con Prisma |
|-----------|-------------------------|---------------------|
| Nueva BD desde cero | `psql <conn> -f database/schema.sql` + `-f database/seeds.sql` | `prisma migrate deploy` + `prisma db seed` |
| BD existente con datos | — | `prisma migrate dev --name <descripcion>` |
| Tests locales | — | `prisma migrate reset` |
| Producción | script unificado, o → | `prisma migrate deploy` |
