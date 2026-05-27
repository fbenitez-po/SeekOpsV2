# Plan: Migración de datos seekops_old → seekops

## Contexto

Dos bases de datos PostgreSQL en el mismo servidor:
- **seekops_old**: Django app legacy, 44 tablas, ~75k filas
- **seekops** (nueva): schema normalizado custom, 31 tablas

La migración usa la extensión `dblink` para leer `seekops_old` directamente desde `seekops`. Todos los scripts son idempotentes: los pasos 2-4 vía `ON CONFLICT DO NOTHING` (tienen unique natural), y los pasos 5, 6 y 7 vía `DELETE FROM <tabla> WHERE created_by='migration'` al inicio del paso (esas tablas no tienen unique natural, así que el `ON CONFLICT` solo no bastaba y re-correr duplicaba).

**Cómo ejecutar:**
```bash
psql -U postgres -d seekops -f .ai/db/migration-seekops-old/migrate_seekops_old.sql
```
Si las bases están en Docker:
```bash
docker exec -i <container> psql -U postgres -d seekops < .ai/db/migration-seekops-old/migrate_seekops_old.sql
```

---

## Estado actual (25 Mayo 2026 — Paso 7 completado)

### Mapa completo de tablas — qué paso llena cada una

| Tabla en seekops | Tipo | Paso | Script | Estado | Filas |
|-----------------|------|------|--------|--------|-------|
| `areas` | Catálogo | 1 | data.sql | ✅ | 8 |
| `teams` | Catálogo | 1 | data.sql | ✅ | 13 |
| `client_sectors` | Catálogo | 1 | data.sql | ✅ | 33 |
| `client_segmentations` | Catálogo | 1 | data.sql | ✅ | 7 |
| `productivity_layers` | Catálogo | 1 | data.sql | ✅ | 3 |
| `work_categories` | Catálogo | 1 | data.sql | ✅ | 18 |
| `project_categories` | Catálogo | 1 | data.sql | ✅ | 34 |
| `project_segmentation` | Catálogo | 1 | data.sql | ✅ | 9 |
| `income_categories` | Catálogo | 1 | data.sql | ✅ | 5 |
| `profiles` | Catálogo | 1 | data.sql | ✅ | 3 |
| `document_types` | Catálogo | 1 | data.sql | ✅ | 7 |
| `service_types` | Catálogo | 1 | data.sql | ✅ | 2 |
| `periods` | Catálogo | 1 | data.sql | ✅ | pre-cargado Jan 2026→May 2028 |
| `users` | Entidad | 2 | migrate_seekops_old.sql | ✅ | 275 |
| `user_area` | Relación (M2M) | 2 | migrate_seekops_old.sql | ✅ | incluido en paso 2 |
| `user_profile` | Relación (M2M) | 2 | migrate_seekops_old.sql | ✅ | incluido en paso 2 |
| `clients` | Entidad | 3 | migrate_seekops_old.sql | ✅ | 102 |
| `projects` | Entidad | 4 | migrate_seekops_old.sql | ✅ | 490 |
| `project_project_category` | Relación (M2M) | 4 | migrate_seekops_old.sql | ✅ | 372 |
| `project_user` | Relación (M2M) | 4 | migrate_seekops_old.sql | ✅ | 1090 (role='SEEKER') |
| `hour_projections` | Transaccional | 5 | migrate_seekops_old.sql | ✅ | 2.563 (1.965 activas, 598 anuladas) |
| `commercial_records` | Transaccional | 6 | migrate_seekops_old.sql | ✅ | 677 (1 excluido: precio negativo) |
| `time_entries` | Transaccional | 7 | migrate_seekops_old.sql | ✅ | 1.593 (sin status: el estado vive en time_entry_approvals) |
| `time_entry_lines` | Transaccional | 7 | migrate_seekops_old.sql | ✅ | 2.928 activas (horas originales del seeker; sin status) |
| `time_entry_approvals` | Fuente de verdad de estado | 7 | migrate_seekops_old.sql | ✅ | 2.928 (una por línea; PENDIENTE/APROBADO/APROBADO_CON_OBSERVACION/RECHAZADO) |
| `revenues` | Financiero | — | no migrar | ⛔ | datos nuevos, sin equivalente |
| `admin_expenses` | Financiero | — | no migrar | ⛔ | datos nuevos, sin equivalente |
| `sales_costs` | Financiero | — | no migrar | ⛔ | datos nuevos, sin equivalente |
| `personnel_costs` | Financiero | — | no migrar | ⛔ | datos nuevos, sin equivalente |
| `refresh_tokens` | Sistema | — | descartado | 🚫 | se generan en runtime |
| `password_reset_tokens` | Sistema | — | descartado | 🚫 | se generan en runtime |

---

## Paso 1 — Catálogos / Tablas maestro ✅

**Qué hace:** Carga los datos de referencia que el resto de las tablas necesitan como FK. Son tablas que no vienen de `seekops_old` sino que se re-crean desde cero en `data.sql` con los mismos valores del sistema anterior.

**Tablas populadas en seekops:**

| Tabla en seekops | Equivalente en seekops_old | Filas | Cómo se resuelve |
|------------------|---------------------------|-------|-----------------|
| `areas` | `masters_area` | 8 | Hardcoded en data.sql — mismos nombres |
| `teams` | `masters_team` | 13 | Hardcoded en data.sql — mismos nombres |
| `client_sectors` | `masters_sector` | 33 | Hardcoded en data.sql — mismos nombres |
| `client_segmentations` | `masters_segmentation` | 7 | Hardcoded en data.sql — mismos nombres |
| `productivity_layers` | `masters_layerproductivity` | 3 | Hardcoded en data.sql — mismos nombres |
| `work_categories` | `masters_usercategory` | 18 | Hardcoded en data.sql — mismos nombres |
| `project_categories` | `masters_extensioncategory` | 34 | Hardcoded en data.sql — mismos nombres |
| `project_segmentation` | `masters_division` | 9 | Hardcoded en data.sql — mismos nombres |
| `income_categories` | *(nuevo concepto)* | 5 | RECLUTAMIENTO, CAPACITACION, COMERCIAL, AREA, CULTURA |
| `profiles` | `auth_group` Django | 3 | ADMIN, GESTOR, SEEKER |
| `document_types` | *(nuevo concepto)* | 7 | Hardcoded |

**Por qué se hace primero:** Todos los pasos siguientes resuelven FKs por nombre/código contra estas tablas.

---

## Paso 2 — Usuarios ✅

**Script:** `migrate_seekops_old.sql` (paso 2)

**Tablas populadas en seekops:** `users`, `user_area`, `user_profile`

**Qué hace:** Migra los 275 usuarios del sistema anterior e inserta las relaciones M2M de áreas y perfiles en la misma transacción.

### Tabla principal: `users_user` → `users`

| Campo old | Campo new | Cómo se resuelve |
|-----------|-----------|-----------------|
| `email` | `email` | directo (es la clave de matching) |
| `first_name`, `last_name` | `first_name`, `last_name` | directo |
| `document_number` | `document_number` | NULLIF si vacío |
| `cellphone` | `mobile_phone` | NULLIF si vacío |
| `job` | `position` | NULLIF si vacío |
| `team_id` (bigint old) | `team_id` (UUID new) | JOIN `masters_team` old → `teams` new **por nombre** |
| `is_active`, `is_staff`, `is_superuser` | igual | directo |
| `created` | `created_at` | explícito — NO usar NOW() porque sería fecha de migración |
| *(no existe)* | `hire_date` | NULL — completar manualmente |
| *(password Django)* | `password_hash` | hash bcrypt temporal `Admin123!`; se re-hashea en primer login |

**Cambios de schema aplicados:**
- `hire_date`: NOT NULL → nullable (no existe en old)
- `position`: NOT NULL → nullable (131 usuarios sin cargo)
- `team_id`: NOT NULL → nullable (2 usuarios sin equipo)
- `document_number`: NOT NULL → nullable (78 externos sin DNI)

### Relación M2M: `users_user_area` → `user_area`

Une cada usuario con las áreas a las que pertenece.
- Resolución: JOIN `users` por `email` + JOIN `areas` por `name`
- PK compuesta: `(user_id, area_id)`

### Relación M2M: `user_profile` (perfiles de acceso)

Reemplaza el sistema de grupos de Django (`auth_group`):

| Grupo Django old | Perfil new | Quiénes |
|-----------------|------------|---------|
| `is_superuser = true` | `ADMIN` | Superusuarios |
| `"Gestor Registro de horas"` | `GESTOR` | Gestores |
| `"Seeker"` | `SEEKER` | Seekers |

- Resolución: JOIN `users` por `email` + JOIN `profiles` por `code`
- PK compuesta: `(user_id, profile_id)`

---

## Paso 3 — Clientes ✅

**Script:** `migrate_seekops_old.sql` (paso 3)

**Tablas populadas en seekops:** `clients`

**Qué hace:** Migra los 102 clientes del sistema anterior.

### Tabla principal: `projects_client` → `clients`

| Campo old | Campo new | Cómo se resuelve |
|-----------|-----------|-----------------|
| `business_reason` | `legal_name` | directo |
| `business_name` | `trade_name` | directo |
| `business_number` | `ruc` | NULLIF si vacío |
| `fiscal_address` | `address` | NULLIF si vacío |
| `segmentation_id` (bigint old) | `segmentation_id` (UUID new) | JOIN `masters_segmentation` old → `client_segmentations` new **por nombre** |
| `sector_id` (bigint old) | `sector_id` (UUID new) | JOIN `masters_sector` old → `client_sectors` new **por nombre** |
| *(no existe)* | `is_active` | siempre `true` — el estado de segmentación no determina actividad |

---

## Paso 4 — Proyectos ✅

**Script:** `migrate_seekops_old.sql` (paso 4)

**Tablas populadas en seekops:** `projects`, `project_project_category`, `project_user`

**Qué hace:** Migra 490 proyectos y sus dos relaciones M2M (categorías y miembros/seekers) en una sola transacción.

### Tabla principal: `projects_project` → `projects`

| Campo old | Campo new | Cómo se resuelve |
|-----------|-----------|-----------------|
| `code`, `name` | `code`, `name` | directo |
| `client_id` (bigint old) | `client_id` (UUID new) | JOIN `projects_client` old → `clients` new **por `business_reason = legal_name`** |
| `manager_id` (bigint old) | `manager_id` (UUID new) | JOIN `users_user` old → `users` new **por email** — NULL si no existe |
| `division_id` (bigint old) | `project_segmentation_id` (UUID new) | JOIN `masters_division` old → `project_segmentation` new **por nombre** — NULL si no tiene |
| `layer_productivity_id` (bigint old) | `productivity_layer_id` (UUID new) | JOIN `masters_layerproductivity` old → `productivity_layers` new **por nombre** |
| `start_date`, `end_date` | `start_date`, `end_date` | directo (2 proyectos tenían fechas invertidas → se intercambiaron) |
| `real_start_date`, `real_end_date` | `actual_start_date`, `actual_end_date` | directo |
| `status = 'open'` | `is_active = true` | mapeo de status a boolean |
| `status = 'close'` | `is_active = false` | mapeo de status a boolean |

**Cambios de schema aplicados:**
- `manager_id`: NOT NULL → nullable (152 proyectos sin manager en old)
- `project_segmentation_id`: NOT NULL → nullable (75 proyectos sin división)
- `name`: VARCHAR(100) → VARCHAR(200) (1 proyecto de 119 caracteres)

### Relación M2M: `projects_project_category_extension` → `project_project_category`

- Resolución: JOIN `projects` por `code` + JOIN `project_categories` por `name`
- PK compuesta: `(project_id, project_category_id)` — 372 asignaciones

### Relación M2M: `projects_project_users` → `project_user`

- Resolución: JOIN `projects` por `code` + JOIN `users` por `email`
- Siempre `role = 'SEEKER'` — el backend filtra por este valor
- PK compuesta: `(project_id, user_id, role)` — 1090 miembros

> ⚠️ Si este script se corre antes de migrar todos los usuarios, los seekers que no existan en `users` se pierden. Re-correr la sección de `project_user` si se agregan usuarios nuevos después.

---

## Paso 5 — Proyecciones de horas ✅

**Script:** `migrate_seekops_old.sql` (paso 5)

**Tablas populadas en seekops:** `hour_projections`

**Qué migra:** Las proyecciones originales de horas asignadas por gestor a cada seeker. Se aplana de dos tablas a una.

### Tablas origen

| Tabla old | Filas | Descripción |
|-----------|-------|-------------|
| `projects_blockoriginalschedule` | 2.566 | Tabla principal: usuario, horas, fechas, categoría. JOIN a `projects_blockoriginal` solo para resolver `project_id` |

### Mapeo de campos

| Campo old | Campo new | Cómo se resuelve |
|-----------|-----------|-----------------|
| `block.project_id` | `project_id` | JOIN `projects_project` → `projects` por code |
| `schedule.user_id` | `user_id` | JOIN `users_user` → `users` por email |
| `schedule.category_id` | `work_category_id` | JOIN `masters_usercategory` → `work_categories` por nombre |
| `schedule.start_date` | `start_date` | LEAST(start, end) — corrige invertidas |
| `schedule.end_date` | `end_date` | GREATEST(start, end) — corrige invertidas |
| `schedule.hours` | `projected_hours` | ROUND(hours * 2) / 2.0 — fuerza múltiplo de 0.5 |
| `block.status = 'Anulado'` | `is_active = false` | resto → true |

> Idempotencia: el paso arranca con `DELETE FROM hour_projections WHERE created_by='migration'`. La tabla no tiene unique natural, así que sin esto re-correr el script duplicaba las filas.

---

## Paso 6 — Registros comerciales ✅

**Script:** `migrate_seekops_old.sql` (paso 6)

**Tablas populadas en seekops:** `commercial_records`

**Qué migra:** 678 registros comerciales (677 migrados, 1 excluido por precio negativo).

### Mapeo de campos

| Campo old | Campo new | Cómo se resuelve |
|-----------|-----------|-----------------|
| `detail` | `detail` | NULLIF si vacío |
| `price` | `price` | solo >= 0 (1 negativo excluido) |
| `coin` | `currency` | directo (PEN/USD) |
| `date` | `record_date` | directo |
| `project_id` | `project_id` | JOIN `projects_project` → `projects` por code |
| `responsible_id` | `owner_id` | JOIN `users_user` → `users` por email; fallback: manager → admin |
| `document` | `document_type_id` | JOIN `document_types` por nombre (`Correo` → NULL) |
| `status` | `has_contract` | directo (boolean) |
| `billing` | `is_billed` | directo (boolean) |
| `evidence_file` | `evidence_filename` | NULLIF si vacío |
| `type` (Proyecto/Recurrente/Renovacion) | *(sin equivalente)* | campo perdido — no existe en nueva BD |

> Idempotencia: el paso arranca con `DELETE FROM commercial_records WHERE created_by='migration'` (misma razón que el Paso 5).

---

## Paso 7 — Horas trabajadas y aprobaciones ✅

**Script:** `migrate_seekops_old.sql` (paso 7)

**Tablas populadas en seekops:** `time_entries`, `time_entry_lines`, `time_entry_approvals`

**Qué migra:** Registros históricos de horas trabajadas por usuario por semana, y el log de aprobaciones (sintetizado, porque el old no tiene tabla de aprobaciones).

### Mapeo de tablas

| Tabla old | Tabla new | Descripción |
|-----------|-----------|-------------|
| `seekers_hoursworkedhead` (2.105) | `time_entries` | Cabecera: una semana por usuario |
| `seekers_hoursworked` (3.005) | `time_entry_lines` | Detalle: una línea por proyecto dentro de la semana |
| *(inline: `manager_id`, `status`, `validated_*`, `justification`)* | `time_entry_approvals` | Log de aprobaciones, sintetizado por línea aprobada/rechazada |

### Fusión semanal (decisión clave)

El old parte una misma semana de un usuario en **varias cabeceras** (una por proyecto): 279 grupos `(usuario, date_init)` duplicados, casi siempre proyectos distintos. La nueva BD exige **una** entrada por `(user_id, week_start_date)` (`UNIQUE`). Por eso se **fusionan**: todas las heads del mismo `(usuario, date_init)` → una `time_entry`, combinando sus líneas. Esto satisface el unique sin cambiar el schema.

### Cabecera (`seekers_hoursworkedhead` → `time_entries`)

| Campo old | Campo new | Cómo se resuelve |
|-----------|-----------|-----------------|
| `user_id` | `user_id` | JOIN `users_user` → `users` por email |
| `date_init` | `week_start_date` | directo (date) |
| *(calculado)* | `week_end_date` | `date_init + 6` (Domingo) — normaliza spans irregulares (4d, etc.) |
| *(ninguno)* | `status` | **columna eliminada** — el estado vive en `time_entry_approvals` |

### Detalle (`seekers_hoursworked` → `time_entry_lines`)

| Campo old | Campo new | Cómo se resuelve |
|-----------|-----------|-----------------|
| `head_id` (vía usuario+semana) | `time_entry_id` | JOIN a la `time_entries` fusionada por `(user_id, week_start_date)` |
| `project_id` | `project_id` | JOIN `projects_project` → `projects` por code |
| `category_extension_id` | `income_category_id` | JOIN `masters_extensioncategory` → `project_categories` por nombre normalizado; NULL si no resuelve (14/14 resuelven) |
| `hours` | `hours` | horas **originales** del seeker (`SUM(l.hours)`). Se agregan las líneas del mismo proyecto+categoría dentro de la semana |
| `extra_hours` | `extra_hours` | análogo (`SUM(COALESCE(l.extra_hours, 0))`) |
| `description` | `comment` | NULLIF si vacío (`string_agg` si hay varias) |
| *(ninguno)* | `status`, `reviewed_by`, `reviewed_at` | **columnas eliminadas** — el estado y la firma del gestor viven en `time_entry_approvals` |

No se generan líneas con baja lógica. Con el nuevo modelo, las horas originales del seeker siempre quedan en la línea activa; la sugerencia del gestor va a `suggested_hours`/`suggested_extra_hours` en la approval.

### Aprobaciones (`time_entry_approvals`, una por línea)

Una fila por cada `time_entry_lines` creada en el paso anterior (incluyendo líneas con estado PENDIENTE en el origen). Estado derivado del `status` agregado de la fuente:

| Campo new | Origen |
|-----------|--------|
| `time_entry_line_id` | JOIN a `time_entry_lines` por `(time_entry_id, project_id, income_category_id)` |
| `status` | `all_approved` + ajuste → `APROBADO_CON_OBSERVACION`; `all_approved` sin ajuste → `APROBADO`; `all_rejected` → `RECHAZADO`; resto → `PENDIENTE` |
| `comment` | `justification` (la justificación del aprobador, `string_agg`). En RECHAZADO, también es el motivo de rechazo. |
| `suggested_hours` / `suggested_extra_hours` | `SUM(validated_*)` solo cuando difiere de `SUM(hours)` (horas ajustadas por el gestor) |
| `reviewed_by` / `reviewed_at` | email del `manager_id` / `max(updated_at)` de líneas aprobadas/rechazadas |
| `created_by` | `'migration'` |

### Heads con fechas rotas — NO migradas

47 cabeceras con rango inválido (`date_end < date_init`, span > 7 días, o fecha NULL) **no se migraron**. Quedan listadas en **`paso7_fechas_rotas_pendientes.sql`** (+ CSV exportado) para corregirlas a mano en el origen y re-ejecutar el Paso 7 (es idempotente).

### Idempotencia

El paso arranca con `DELETE FROM time_entries WHERE created_by='migration'`; el FK `ON DELETE CASCADE` limpia `time_entry_lines` y `time_entry_approvals`. Re-ejecutar deja los conteos estables.

---

## Tablas que NO se migran

| Tabla old | Razón |
|-----------|-------|
| `projects_block` / `projects_blockschedule` | Reemplazadas por `hour_projections` vía blockoriginalschedule |
| `projects_blockoriginal` | Solo se usa como FK resolver para blockoriginalschedule |
| `notifications_*` | No existe en nueva BD |
| `seekway_*` | Sin uso |
| `projects_projectdeliverable` / `projects_projectmedia` | No existe en nueva BD |
| `django_admin_log` | Audit interno Django — 28k filas innecesarias |
| Tablas Django framework | No aplican |

---

## Pendientes activos

| # | Pendiente | Prioridad |
|---|-----------|-----------|
| 1 | ~~Crear script Paso 7 (horas trabajadas)~~ — resuelto: migrado ✅ | ✅ |
| 2 | ~~Confirmar lógica is_active de clientes~~ — resuelto: todos migran como `true` | ✅ |
| 3 | Corregir las 47 heads con fechas rotas (ver `paso7_fechas_rotas_pendientes.sql`) y re-correr Paso 7 | Media |
| 4 | Completar `hire_date` manualmente para los 275 usuarios | Baja (post-MVP) |
| 5 | Completar `manager_id` para los 152 proyectos sin gestor | Baja (post-MVP) |

---

## Archivos

| Archivo | Descripción |
|---------|-------------|
| `.ai/db/schema.sql` | DDL completo de seekops (fuente de verdad) |
| `.ai/db/data.sql` | Seeds: catálogos + usuario admin |
| `.ai/db/schema.md` | Documentación del schema |
| `.ai/db/migration-seekops-old/migration_plan.md` | Este archivo |
| `.ai/db/migration-seekops-old/migrate_seekops_old.sql` | Script unificado pasos 2-7 |
| `.ai/db/migration-seekops-old/paso7_fechas_rotas_pendientes.sql` | Query de las 47 heads con fechas rotas (no migradas) |
| `.ai/db/migration-seekops-old/paso7_fechas_rotas_pendientes.csv` | Export de esas heads/líneas para corrección manual |
