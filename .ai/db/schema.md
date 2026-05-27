# Schema de Base de Datos — Seekops

> PostgreSQL schema: tablas, columnas, relaciones, índices y decisiones.
> **Fuente de verdad:** `.ai/db/schema.sql` (DDL) + `.ai/db/data.sql` (datos)
> Identificadores en inglés. Auditoría tiered. Tablas puente con PK compuesta.
> **Última actualización:** 22 de Mayo 2026

---

## Diagrama ER Simplificado

```
┌──────────────────────────────────────────────────────────────┐
│                        CONFIGURACIÓN                          │
├──────────────────────────────────────────────────────────────┤
│ work_categories     client_segmentations  client_sectors       │
│ service_types       project_segmentation  project_categories   │
│ productivity_layers teams   areas                              │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                        ENTIDADES CORE                         │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  users ──→ team_id → teams                                    │
│    ├─→ user_area (M2M → areas)                                │
│    ├─→ user_profile (M2M → profiles)                          │
│    └─→ project_user (M2M → projects, con role)                │
│                                                               │
│  clients → projects → project_user → users                    │
│              ├─→ project_project_category → project_categories │
│              ├─→ time_entries → time_entry_lines              │
│              │              └─→ time_entry_approvals          │
│              ├─→ hour_projections                             │
│              ├─→ revenues                                     │
│              └─→ commercial_records                           │
│                                                               │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                    FINANZAS / PERÍODOS                        │
├──────────────────────────────────────────────────────────────┤
│  periods → revenues (project_id, period_id)                   │
│         → admin_expenses                                      │
│         → sales_costs                                         │
│         → personnel_costs (user_id, period_id)                │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                      COMERCIAL                                │
├──────────────────────────────────────────────────────────────┤
│  document_types ← commercial_records → projects, users       │
└──────────────────────────────────────────────────────────────┘
```

---

## Auditoría tiered (convención global)

Bloque estándar al final de cada tabla, en este orden:

```sql
created_at TIMESTAMP   NOT NULL DEFAULT NOW(),
created_by VARCHAR(50) NOT NULL DEFAULT 'admin',
updated_at TIMESTAMP,
updated_by VARCHAR(50),
deleted_at TIMESTAMP,
deleted_by VARCHAR(50),
is_active  BOOLEAN     NOT NULL DEFAULT true
```

| Tier | Tablas | Campos de auditoría |
|------|--------|---------------------|
| Completo (7 campos) | 10 catálogos + `users`, `profiles`, `clients`, `projects` + `time_entries`, `time_entry_lines`, `hour_projections`, `periods`, `revenues`, `admin_expenses`, `sales_costs`, `personnel_costs`, `commercial_records` (23 tablas) | bloque completo |
| Puente mínimo | `user_area`, `user_profile`, `project_project_category` | solo `created_at`, `created_by` |
| Puente con estado | `project_user` | `created_at`, `created_by`, `updated_at`, `updated_by`, `is_active` |
| Approval (mutable 1:1) | `time_entry_approvals` | `created_at`, `created_by` (carga) + `reviewed_by`, `reviewed_at` (acción gestor) |
| Sin bloque | `refresh_tokens`, `password_reset_tokens` | solo su `created_at` propio |

`created_by`/`updated_by`/`deleted_by` guardan el **email** del responsable (o `'admin'` por defecto), `VARCHAR(50)`, sin FK.

---

## Tablas de Configuración

Las 10 tablas de catálogo comparten la misma estructura base (bloque de auditoría completo). `project_categories` tiene columna adicional `is_area_type`. `document_types` ver sección Comercial.

> **Nota (2026-05-22):** `income_categories` fue **eliminada**. Sus 5 categorías de área fueron absorbidas por `project_categories` mediante el flag `is_area_type = true`. La tabla contaba como catálogo; el total de tablas pasó de 31 a **30**.

```sql
-- Ejemplo estructura catálogo estándar
CREATE TABLE IF NOT EXISTS work_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        VARCHAR(50)  NOT NULL UNIQUE,
  name        VARCHAR(100) NOT NULL,
  ...auditoría completa...
);

-- project_categories: tiene campo adicional
CREATE TABLE IF NOT EXISTS project_categories (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code         VARCHAR(50)  NOT NULL UNIQUE,
  name         VARCHAR(100) NOT NULL,
  is_area_type BOOLEAN      NOT NULL DEFAULT false,   -- ← distingue categorías de área
  ...auditoría completa...
);
CREATE INDEX IF NOT EXISTS idx_project_categories_is_area_type ON project_categories(is_area_type);
```

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

---

## Tablas Core

### users

Usuarios del sistema (Seekers, Gestores, Admins). Soft delete con `is_active`. Sin `area_id` (áreas vía `user_area`). `is_staff`/`is_superuser` son booleanos de negocio (antes del bloque de auditoría).

```sql
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           VARCHAR(255) NOT NULL UNIQUE,
  password_hash   VARCHAR(255) NOT NULL DEFAULT '$placeholder$',
  document_number VARCHAR(20)  NOT NULL UNIQUE,
  first_name      VARCHAR(100) NOT NULL,
  last_name       VARCHAR(100) NOT NULL,
  position        VARCHAR(100) NOT NULL,
  mobile_phone    VARCHAR(20),
  avatar_url      VARCHAR(500),
  team_id         UUID NOT NULL REFERENCES teams(id),
  hire_date       DATE NOT NULL,
  is_staff        BOOLEAN     NOT NULL DEFAULT false,
  is_superuser    BOOLEAN     NOT NULL DEFAULT false,
  created_at      TIMESTAMP   NOT NULL DEFAULT NOW(),
  created_by      VARCHAR(50) NOT NULL DEFAULT 'admin',
  updated_at      TIMESTAMP,
  updated_by      VARCHAR(50),
  deleted_at      TIMESTAMP,
  deleted_by      VARCHAR(50),
  is_active       BOOLEAN     NOT NULL DEFAULT true
);
CREATE INDEX IF NOT EXISTS idx_users_email           ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_document_number ON users(document_number);
CREATE INDEX IF NOT EXISTS idx_users_is_active       ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_team_id         ON users(team_id);
```

### profiles

Perfiles / grupos de permisos del sistema. Renombrada desde `user_groups`. Bloque de auditoría completo.

```sql
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        VARCHAR(50)  NOT NULL UNIQUE,
  name        VARCHAR(100) NOT NULL,
  description TEXT,
  created_at  TIMESTAMP   NOT NULL DEFAULT NOW(),
  created_by  VARCHAR(50) NOT NULL DEFAULT 'admin',
  updated_at  TIMESTAMP,
  updated_by  VARCHAR(50),
  deleted_at  TIMESTAMP,
  deleted_by  VARCHAR(50),
  is_active   BOOLEAN     NOT NULL DEFAULT true
);
CREATE INDEX IF NOT EXISTS idx_profiles_code ON profiles(code);
```

**Seeds:** ADMIN (Administradores), SEEKER (Seekers), GESTOR (Gestores)

### clients

Clientes para los que se trabaja. Soft delete con `is_active`. `legal_name` (ex `razon_social`) es el identificador principal (NOT NULL); `nombre` fue eliminado (migr. 012) y la FK `client_category_id` también (migr. 021).

```sql
CREATE TABLE IF NOT EXISTS clients (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legal_name      VARCHAR(150) NOT NULL,
  trade_name      VARCHAR(150),
  ruc             VARCHAR(14)  NOT NULL UNIQUE,
  contact_name    VARCHAR(100),
  contact_email   VARCHAR(255),
  phone           VARCHAR(20),
  address         VARCHAR(200),
  segmentation_id UUID NOT NULL REFERENCES client_segmentations(id),
  sector_id       UUID REFERENCES client_sectors(id),
  created_at      TIMESTAMP   NOT NULL DEFAULT NOW(),
  created_by      VARCHAR(50) NOT NULL DEFAULT 'admin',
  updated_at      TIMESTAMP,
  updated_by      VARCHAR(50),
  deleted_at      TIMESTAMP,
  deleted_by      VARCHAR(50),
  is_active       BOOLEAN     NOT NULL DEFAULT true
);
CREATE INDEX IF NOT EXISTS idx_clients_ruc             ON clients(ruc);
CREATE INDEX IF NOT EXISTS idx_clients_is_active       ON clients(is_active);
CREATE INDEX IF NOT EXISTS idx_clients_segmentation_id ON clients(segmentation_id);
CREATE INDEX IF NOT EXISTS idx_clients_sector_id       ON clients(sector_id);
```

### projects

Proyectos de clientes. Soft delete con `is_active`. `descripcion` fue eliminado (migr. 013). `manager_id` (ex `gestor_id`). `actual_start_date`/`actual_end_date` (ex `fecha_*_real`) para desviaciones.

```sql
CREATE TABLE IF NOT EXISTS projects (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code                    VARCHAR(20)  NOT NULL UNIQUE,
  name                    VARCHAR(100) NOT NULL,
  client_id               UUID NOT NULL REFERENCES clients(id),
  project_segmentation_id UUID NOT NULL REFERENCES project_segmentation(id),
  productivity_layer_id   UUID REFERENCES productivity_layers(id),
  service_type_id         UUID REFERENCES service_types(id),
  area_id                 UUID REFERENCES areas(id),
  manager_id              UUID NOT NULL REFERENCES users(id),
  start_date              DATE,
  end_date                DATE,
  actual_start_date       DATE,
  actual_end_date         DATE,
  created_at              TIMESTAMP   NOT NULL DEFAULT NOW(),
  created_by              VARCHAR(50) NOT NULL DEFAULT 'admin',
  updated_at              TIMESTAMP,
  updated_by              VARCHAR(50),
  deleted_at              TIMESTAMP,
  deleted_by              VARCHAR(50),
  is_active               BOOLEAN     NOT NULL DEFAULT true,
  CONSTRAINT check_end_date_after_start
    CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);
CREATE INDEX IF NOT EXISTS idx_projects_code                    ON projects(code);
CREATE INDEX IF NOT EXISTS idx_projects_client_id               ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_manager_id              ON projects(manager_id);
CREATE INDEX IF NOT EXISTS idx_projects_is_active               ON projects(is_active);
CREATE INDEX IF NOT EXISTS idx_projects_project_segmentation_id ON projects(project_segmentation_id);
CREATE INDEX IF NOT EXISTS idx_projects_area_id                 ON projects(area_id);
```

---

## Tablas Puente (PK compuesta, sin `id`)

### user_area

Áreas asignadas a cada usuario (ex `user_areas`). Un usuario debe tener al menos un área. Auditoría mínima.

```sql
CREATE TABLE IF NOT EXISTS user_area (
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  area_id    UUID NOT NULL REFERENCES areas(id),
  created_at TIMESTAMP   NOT NULL DEFAULT NOW(),
  created_by VARCHAR(50) NOT NULL DEFAULT 'admin',
  PRIMARY KEY (user_id, area_id)
);
CREATE INDEX IF NOT EXISTS idx_user_area_user_id ON user_area(user_id);
CREATE INDEX IF NOT EXISTS idx_user_area_area_id ON user_area(area_id);
```

### user_profile

Perfiles de un usuario (ex `user_group_members`; su FK `group_id` → `profile_id`). Auditoría mínima.

```sql
CREATE TABLE IF NOT EXISTS user_profile (
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP   NOT NULL DEFAULT NOW(),
  created_by VARCHAR(50) NOT NULL DEFAULT 'admin',
  PRIMARY KEY (user_id, profile_id)
);
CREATE INDEX IF NOT EXISTS idx_user_profile_user_id    ON user_profile(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profile_profile_id ON user_profile(profile_id);
```

### project_project_category

Categorías de un proyecto (multi-select; ex `project_project_categories`). Auditoría mínima.

```sql
CREATE TABLE IF NOT EXISTS project_project_category (
  project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  project_category_id UUID NOT NULL REFERENCES project_categories(id),
  created_at          TIMESTAMP   NOT NULL DEFAULT NOW(),
  created_by          VARCHAR(50) NOT NULL DEFAULT 'admin',
  PRIMARY KEY (project_id, project_category_id)
);
CREATE INDEX IF NOT EXISTS idx_project_project_category_project_id  ON project_project_category(project_id);
CREATE INDEX IF NOT EXISTS idx_project_project_category_category_id ON project_project_category(project_category_id);
```

### project_user

Usuarios asignados a un proyecto con su `role` (ex `project_users`). PK compuesta `(project_id, user_id, role)`. Conserva `is_active` (estado de la asignación) + `updated_*`.

```sql
CREATE TABLE IF NOT EXISTS project_user (
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role       VARCHAR(50) NOT NULL,
  created_at TIMESTAMP   NOT NULL DEFAULT NOW(),
  created_by VARCHAR(50) NOT NULL DEFAULT 'admin',
  updated_at TIMESTAMP,
  updated_by VARCHAR(50),
  is_active  BOOLEAN     NOT NULL DEFAULT true,
  PRIMARY KEY (project_id, user_id, role)
);
CREATE INDEX IF NOT EXISTS idx_project_user_project_id ON project_user(project_id);
CREATE INDEX IF NOT EXISTS idx_project_user_user_id    ON project_user(user_id);
CREATE INDEX IF NOT EXISTS idx_project_user_is_active  ON project_user(is_active);
```

---

## Tablas Transaccionales

### time_entries

Registros semanales de horas (cabecera). Un registro por (usuario, semana). La semana se identifica por su **rango de fechas** `week_start_date` (lunes) / `week_end_date` (domingo) — no por un código string. Bloque de auditoría completo. **Sin columna `status`** — el estado de revisión vive únicamente en `time_entry_approvals`.

> **Decisión 2026-05-26:** Se eliminó `status` de `time_entries`. El estado de semana no existe como concepto; solo interesa el estado por línea (proyecto+categoría).

```sql
CREATE TABLE IF NOT EXISTS time_entries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,                  -- lunes de la semana (Lun–Dom)
  week_end_date   DATE NOT NULL,                  -- domingo = week_start_date + 6
  created_at      TIMESTAMP   NOT NULL DEFAULT NOW(),
  created_by      VARCHAR(50) NOT NULL DEFAULT 'admin',
  updated_at      TIMESTAMP,
  updated_by      VARCHAR(50),
  deleted_at      TIMESTAMP,
  deleted_by      VARCHAR(50),
  is_active       BOOLEAN     NOT NULL DEFAULT true,
  UNIQUE (user_id, week_start_date)
);
CREATE INDEX IF NOT EXISTS idx_time_entries_user_id         ON time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_week_start      ON time_entries(week_start_date);
CREATE INDEX IF NOT EXISTS idx_time_entries_user_week_start ON time_entries(user_id, week_start_date);
```

### time_entry_lines

Registro **inmutable** de lo que cargó el seeker. Una línea por proyecto+categoría. `hours`/`extra_hours` NUMERIC(x,1), múltiplos de 0.5. **Sin columna `status`** — el estado de revisión vive en `time_entry_approvals`. Cada línea tiene exactamente una approval asociada (`time_entry_approvals.time_entry_line_id`).

> **Decisión 2026-05-26:** Se eliminaron `status`, `reviewed_by` y `reviewed_at` de `time_entry_lines`. La tabla ahora es de solo escritura (lo que cargó el seeker no se modifica nunca). Si el gestor rechaza y el seeker re-carga, la línea vieja queda (histórico) y se crean línea nueva + approval PENDIENTE nueva.

`income_category_id` referencia `project_categories` (antes `income_categories`, eliminada en 2026-05-22). Solo aplica para proyectos de área; en proyectos normales es NULL.

```sql
CREATE TABLE IF NOT EXISTS time_entry_lines (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  time_entry_id      UUID NOT NULL REFERENCES time_entries(id) ON DELETE CASCADE,
  project_id         UUID NOT NULL REFERENCES projects(id),
  income_category_id UUID REFERENCES project_categories(id),   -- nullable; solo para proyectos de área
  hours              NUMERIC(6,1) NOT NULL,
  extra_hours        NUMERIC(4,1) NOT NULL DEFAULT 0,
  comment            TEXT,
  created_at         TIMESTAMP   NOT NULL DEFAULT NOW(),
  created_by         VARCHAR(50) NOT NULL DEFAULT 'admin',
  updated_at         TIMESTAMP,
  updated_by         VARCHAR(50),
  deleted_at         TIMESTAMP,
  deleted_by         VARCHAR(50),
  is_active          BOOLEAN     NOT NULL DEFAULT true,
  CONSTRAINT check_hours_range       CHECK (hours >= 0 AND MOD(hours, 0.5) = 0),
  CONSTRAINT check_extra_hours_range CHECK (extra_hours >= 0 AND extra_hours <= 8 AND MOD(extra_hours, 0.5) = 0)
);
CREATE INDEX IF NOT EXISTS idx_time_entry_lines_time_entry_id ON time_entry_lines(time_entry_id);
CREATE INDEX IF NOT EXISTS idx_time_entry_lines_project_id    ON time_entry_lines(project_id);
```

### time_entry_approvals

**Fuente de verdad del estado de revisión.** Una fila por línea (`time_entry_line_id` UNIQUE), creada en `PENDIENTE` al cargar el seeker. El gestor la muta a `APROBADO | APROBADO_CON_OBSERVACION | RECHAZADO`. Auditoría mínima (`created_at`/`created_by` = momento de carga; `reviewed_by`/`reviewed_at` = acción del gestor). El campo `comment` es el portador unificado del texto libre del gestor: observación en `APROBADO_CON_OBSERVACION`, motivo de rechazo en `RECHAZADO`.

> **Decisión 2026-05-26:** `time_entry_approvals` pasa de log inmutable a registro 1:1 con la línea. `action` renombrado a `status`. Al observar, las horas sugeridas van **solo** a `suggested_hours`/`suggested_extra_hours` — nunca se modifican las `time_entry_lines`. `time_entry_id` eliminado (redundante — alcanzable vía `time_entry_line_id → time_entry_lines.time_entry_id`).
>
> **Decisión 2026-05-27:** Eliminadas tres columnas redundantes: `rejection_reason` (unificada en `comment`), `can_resubmit` (el re-envío lo determina el estado `RECHAZADO`, no este campo), `project_id` (redundante — alcanzable vía `time_entry_line_id → time_entry_lines.project_id`).

```sql
CREATE TABLE IF NOT EXISTS time_entry_approvals (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  time_entry_line_id    UUID UNIQUE NOT NULL REFERENCES time_entry_lines(id) ON DELETE CASCADE,  -- 1:1; time_entry alcanzable vía línea
  status                VARCHAR(50) NOT NULL DEFAULT 'PENDIENTE',  -- PENDIENTE|APROBADO|APROBADO_CON_OBSERVACION|RECHAZADO
  comment               TEXT,                -- observación (APROBADO_CON_OBSERVACION) o motivo de rechazo (RECHAZADO)
  suggested_hours       NUMERIC(6,1),        -- solo en APROBADO_CON_OBSERVACION
  suggested_extra_hours NUMERIC(4,1),        -- solo en APROBADO_CON_OBSERVACION
  reviewed_by           VARCHAR(50),         -- email del gestor que actuó
  reviewed_at           TIMESTAMP,           -- cuándo actuó el gestor
  created_at            TIMESTAMP   NOT NULL DEFAULT NOW(),
  created_by            VARCHAR(50) NOT NULL DEFAULT 'admin'
);
CREATE INDEX IF NOT EXISTS idx_time_entry_approvals_line_id  ON time_entry_approvals(time_entry_line_id);
CREATE INDEX IF NOT EXISTS idx_time_entry_approvals_status   ON time_entry_approvals(status);
CREATE INDEX IF NOT EXISTS idx_time_entry_approvals_created_at ON time_entry_approvals(created_at);
CREATE INDEX IF NOT EXISTS idx_time_entry_approvals_created_by ON time_entry_approvals(created_by);
```

### refresh_tokens / password_reset_tokens

Tokens de sesión y recuperación de contraseña. Sin bloque de auditoría (solo `created_at` propio).

```sql
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  token      TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  token      TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
```

### hour_projections

Proyecciones de horas del gestor para un usuario en un proyecto. `projected_hours` NUMERIC(8,1) múltiplos de 0.5. `work_category_id` opcional (FK a `work_categories`). Bloque de auditoría completo.

```sql
CREATE TABLE IF NOT EXISTS hour_projections (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  work_category_id UUID REFERENCES work_categories(id) ON DELETE SET NULL,
  start_date       DATE         NOT NULL,
  end_date         DATE         NOT NULL,
  projected_hours  NUMERIC(8,1) NOT NULL,
  notes            TEXT,
  created_at       TIMESTAMP   NOT NULL DEFAULT NOW(),
  created_by       VARCHAR(50) NOT NULL DEFAULT 'admin',
  updated_at       TIMESTAMP,
  updated_by       VARCHAR(50),
  deleted_at       TIMESTAMP,
  deleted_by       VARCHAR(50),
  is_active        BOOLEAN     NOT NULL DEFAULT true,
  CONSTRAINT check_projection_dates CHECK (end_date >= start_date),
  CONSTRAINT check_projected_hours  CHECK (projected_hours > 0 AND MOD(projected_hours, 0.5) = 0)
);
CREATE INDEX IF NOT EXISTS idx_hour_projections_project_id       ON hour_projections(project_id);
CREATE INDEX IF NOT EXISTS idx_hour_projections_user_id          ON hour_projections(user_id);
CREATE INDEX IF NOT EXISTS idx_hour_projections_project_user     ON hour_projections(project_id, user_id);
CREATE INDEX IF NOT EXISTS idx_hour_projections_dates            ON hour_projections(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_hour_projections_work_category_id ON hour_projections(work_category_id);
```

---

## Finanzas — Períodos

### periods

Períodos mensuales con estado abierto/cerrado (`is_closed`). Seed: Jan 2026 → May 2028; Jan–Mar 2026 cerrados (en `data.sql`).

```sql
CREATE TABLE IF NOT EXISTS periods (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month      INTEGER NOT NULL,
  year       INTEGER NOT NULL,
  is_closed  BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP   NOT NULL DEFAULT NOW(),
  created_by VARCHAR(50) NOT NULL DEFAULT 'admin',
  updated_at TIMESTAMP,
  updated_by VARCHAR(50),
  deleted_at TIMESTAMP,
  deleted_by VARCHAR(50),
  is_active  BOOLEAN     NOT NULL DEFAULT true,
  CONSTRAINT check_periods_month   CHECK (month BETWEEN 1 AND 12),
  CONSTRAINT check_periods_year    CHECK (year >= 2020),
  CONSTRAINT uq_periods_month_year UNIQUE (month, year)
);
CREATE INDEX IF NOT EXISTS idx_periods_year       ON periods(year);
CREATE INDEX IF NOT EXISTS idx_periods_year_month ON periods(year, month);
```

### revenues

Ingresos por proyecto y período (ex `ingresos`). Uno por (`project_id`, `period_id`).

```sql
CREATE TABLE IF NOT EXISTS revenues (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  period_id  UUID NOT NULL REFERENCES periods(id)  ON DELETE CASCADE,
  amount     NUMERIC(14,2) NOT NULL,
  created_at TIMESTAMP   NOT NULL DEFAULT NOW(),
  created_by VARCHAR(50) NOT NULL DEFAULT 'admin',
  updated_at TIMESTAMP,
  updated_by VARCHAR(50),
  deleted_at TIMESTAMP,
  deleted_by VARCHAR(50),
  is_active  BOOLEAN     NOT NULL DEFAULT true,
  CONSTRAINT check_revenues_amount      CHECK (amount >= 0),
  CONSTRAINT uq_revenues_project_period UNIQUE (project_id, period_id)
);
CREATE INDEX IF NOT EXISTS idx_revenues_project_id ON revenues(project_id);
CREATE INDEX IF NOT EXISTS idx_revenues_period_id  ON revenues(period_id);
```

### admin_expenses / sales_costs

Gastos administrativos (ex `gastos_admin`) y costos de venta (ex `costos_venta`). Misma estructura, categoría separada. Múltiples líneas por período con `code` libre.

```sql
CREATE TABLE IF NOT EXISTS admin_expenses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id   UUID NOT NULL REFERENCES periods(id) ON DELETE CASCADE,
  code        VARCHAR(50) NOT NULL,
  description VARCHAR(255),
  amount      NUMERIC(14,2) NOT NULL,
  created_at  TIMESTAMP   NOT NULL DEFAULT NOW(),
  created_by  VARCHAR(50) NOT NULL DEFAULT 'admin',
  updated_at  TIMESTAMP,
  updated_by  VARCHAR(50),
  deleted_at  TIMESTAMP,
  deleted_by  VARCHAR(50),
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  CONSTRAINT check_admin_expenses_amount CHECK (amount >= 0)
);
CREATE INDEX IF NOT EXISTS idx_admin_expenses_period_id ON admin_expenses(period_id);
-- sales_costs: idéntica, con CONSTRAINT check_sales_costs_amount e idx_sales_costs_period_id
```

### personnel_costs

Remuneración por persona por período (ex `costos_por_persona`). Uno por (`period_id`, `user_id`).

```sql
CREATE TABLE IF NOT EXISTS personnel_costs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id     UUID NOT NULL REFERENCES periods(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
  compensation  NUMERIC(14,2) NOT NULL,
  business_days INTEGER NOT NULL,
  hours_per_day INTEGER NOT NULL DEFAULT 8,
  created_at    TIMESTAMP   NOT NULL DEFAULT NOW(),
  created_by    VARCHAR(50) NOT NULL DEFAULT 'admin',
  updated_at    TIMESTAMP,
  updated_by    VARCHAR(50),
  deleted_at    TIMESTAMP,
  deleted_by    VARCHAR(50),
  is_active     BOOLEAN     NOT NULL DEFAULT true,
  CONSTRAINT check_personnel_costs_compensation  CHECK (compensation >= 0),
  CONSTRAINT check_personnel_costs_business_days CHECK (business_days > 0),
  CONSTRAINT check_personnel_costs_hours_per_day CHECK (hours_per_day > 0),
  CONSTRAINT uq_personnel_costs_period_user      UNIQUE (period_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_personnel_costs_period_id ON personnel_costs(period_id);
CREATE INDEX IF NOT EXISTS idx_personnel_costs_user_id   ON personnel_costs(user_id);
```

---

## Comercial

### document_types

Catálogo de tipos de documento comercial (ex `tipos_documento`). Bloque de auditoría completo. Sin índice adicional.

```sql
CREATE TABLE IF NOT EXISTS document_types (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP   NOT NULL DEFAULT NOW(),
  created_by VARCHAR(50) NOT NULL DEFAULT 'admin',
  updated_at TIMESTAMP,
  updated_by VARCHAR(50),
  deleted_at TIMESTAMP,
  deleted_by VARCHAR(50),
  is_active  BOOLEAN     NOT NULL DEFAULT true
);
```

**Seeds:** Orden de Compra, Contrato, Propuesta, Addendum, Carta de Intención, Factura Proforma, Otro

### commercial_records

Registros comerciales (propuestas, contratos) vinculados a proyectos (ex `registros_comerciales`). `owner_id` (ex `responsable_id`), `has_contract` (ex `estado_contrato`), `is_billed` (ex `facturacion`).

```sql
CREATE TABLE IF NOT EXISTS commercial_records (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_date       DATE NOT NULL,
  project_id        UUID NOT NULL REFERENCES projects(id),
  owner_id          UUID NOT NULL REFERENCES users(id),
  detail            TEXT,
  price             NUMERIC(12,2) NOT NULL,
  currency          VARCHAR(3) NOT NULL DEFAULT 'PEN',
  document_type_id  UUID REFERENCES document_types(id),
  has_contract      BOOLEAN NOT NULL DEFAULT false,
  is_billed         BOOLEAN NOT NULL DEFAULT false,
  evidence_filename VARCHAR(500),
  created_at        TIMESTAMP   NOT NULL DEFAULT NOW(),
  created_by        VARCHAR(50) NOT NULL DEFAULT 'admin',
  updated_at        TIMESTAMP,
  updated_by        VARCHAR(50),
  deleted_at        TIMESTAMP,
  deleted_by        VARCHAR(50),
  is_active         BOOLEAN     NOT NULL DEFAULT true,
  CONSTRAINT check_commercial_records_price CHECK (price >= 0)
);
CREATE INDEX IF NOT EXISTS idx_commercial_records_project_id  ON commercial_records(project_id);
CREATE INDEX IF NOT EXISTS idx_commercial_records_owner_id    ON commercial_records(owner_id);
CREATE INDEX IF NOT EXISTS idx_commercial_records_record_date ON commercial_records(record_date DESC);
```

---

## Relaciones (Resumen)

| Tabla A | Relación | Tabla B | Implementación |
|---------|----------|---------|----------------|
| users | N:1 | teams | FK team_id |
| users | M:N | areas | via user_area |
| users | M:N | profiles | via user_profile |
| users | M:N | projects | via project_user (con role) |
| users | 1:N | projects | FK manager_id |
| users | 1:N | time_entries | FK user_id |
| users | 1:N | personnel_costs | FK user_id |
| clients | N:1 | client_segmentations | FK segmentation_id |
| clients | N:0..1 | client_sectors | FK sector_id (nullable) |
| clients | 1:N | projects | FK client_id |
| projects | N:1 | project_segmentation | FK project_segmentation_id |
| projects | N:0..1 | productivity_layers | FK productivity_layer_id (nullable) |
| projects | N:0..1 | service_types | FK service_type_id (nullable) |
| projects | N:0..1 | areas | FK area_id (nullable) |
| projects | M:N | project_categories | via project_project_category |
| projects | 1:N | hour_projections | FK project_id |
| projects | 1:N | revenues | FK project_id |
| projects | 1:N | commercial_records | FK project_id |
| time_entries | 1:N | time_entry_lines | FK time_entry_id |
| time_entries | 1:N | time_entry_approvals | FK time_entry_id |
| time_entry_lines | N:0..1 | project_categories | FK income_category_id (nullable; solo proyectos de área) |
| hour_projections | N:0..1 | work_categories | FK work_category_id (nullable) |
| periods | 1:N | revenues | FK period_id |
| periods | 1:N | admin_expenses | FK period_id |
| periods | 1:N | sales_costs | FK period_id |
| periods | 1:N | personnel_costs | FK period_id |
| document_types | 1:N | commercial_records | FK document_type_id |

> **Nota auditoría:** `created_by` / `updated_by` / `deleted_by` son `VARCHAR(50)` (email, o `'admin'` por defecto). No son FK — no aparecen en esta tabla.

---

## Decisiones de Diseño

### Identificadores en inglés
Todos los nombres de tablas/columnas/constraints/índices están en inglés (limpieza 2026-05-18). Los valores de datos pueden quedar en español (contenido de negocio: `'PENDIENTE'`, nombres de catálogos, etc.). `ruc` se conserva (término tributario local).

### UUIDs como Primary Keys
Entidades, catálogos y transaccionales usan UUID (`gen_random_uuid()`). Las 4 tablas puente **no** tienen `id` surrogate: PK compuesta (`user_area`, `user_profile`, `project_project_category`, `project_user`).

### Auditoría tiered
Ver tabla en la sección "Auditoría tiered". No todas las tablas llevan el bloque completo: puentes, tokens y el log de aprobaciones llevan menos. `created_by`/`updated_by`/`deleted_by` = email (o `'admin'`), `VARCHAR(50)`, sin FK. `updated_at` es nullable (sin default).

### Soft Deletes
Campo `is_active` (boolean, ex `enabled`). Queries filtran `WHERE is_active = true`. Las tablas con soft delete completo tienen además `deleted_at` y `deleted_by`.

### Layout inline
Constraints (FK/UNIQUE/CHECK) e índices van inline o junto a cada `CREATE TABLE` (estilo terso, sin `ALTER TABLE` separados).

### Horas en NUMERIC
`hours`, `extra_hours` y `projected_hours` son `NUMERIC` para soportar medias horas (0.5). Constraints requieren múltiplos de 0.5.

### area_id en projects es nullable
Proyectos pueden o no pertenecer a un área. La UI lo controla con un checkbox.

### Renombrado de tablas (limpieza 2026-05-18)
`user_groups→profiles`, `user_areas→user_area`, `user_group_members→user_profile` (`group_id→profile_id`), `project_project_categories→project_project_category`, `project_users→project_user`, `periodos→periods`, `ingresos→revenues`, `gastos_admin→admin_expenses`, `costos_venta→sales_costs`, `costos_por_persona→personnel_costs`, `tipos_documento→document_types`, `registros_comerciales→commercial_records`.

### client_categories renombrada a work_categories (migración 021)
Contenía tipos de trabajo, no categorías de cliente. Se eliminó la FK `clients.client_category_id` y `hour_projections` usa `work_category_id`.

### time_entry_approvals como fuente de verdad (2026-05-26, simplificado 2026-05-27)
Una fila por línea (`time_entry_line_id` UNIQUE), creada en `PENDIENTE` al cargar. El gestor la muta al estado terminal. Las horas sugeridas del gestor van a `suggested_hours`/`suggested_extra_hours` — nunca modifican `time_entry_lines`. Si se rechaza, el seeker puede re-cargar: se crea un par nuevo (línea + approval PENDIENTE); la vieja queda como histórico. El campo `comment` porta el texto libre del gestor en cualquier acción (observación o motivo de rechazo). `project_id`, `rejection_reason` y `can_resubmit` fueron eliminados por ser redundantes.

### Acceso del Gestor a proyectos
Un Gestor tiene acceso a todos los proyectos donde figura como `manager_id`, independientemente de si tiene fila en `project_user`. Validado en tres puntos del backend.

### Períodos financieros pre-cargados
`periods` se inicializa (en `data.sql`) con Jan 2026 → May 2028. Los primeros 3 meses (Jan–Mar 2026) arrancan cerrados.

---

## Resumen de Tablas

| Grupo | Tablas |
|-------|--------|
| Configuración (11) | income_categories, work_categories, service_types, client_segmentations, client_sectors, project_segmentation, project_categories, productivity_layers, teams, areas, document_types |
| Catálogos (10) | work_categories, service_types, client_segmentations, client_sectors, teams, areas, project_segmentation, project_categories, productivity_layers, document_types |
| Core (4) | users, profiles, clients, projects |
| Puente (4) | user_area, user_profile, project_project_category, project_user |
| Transaccional (6) | time_entries, time_entry_lines, time_entry_approvals, refresh_tokens, password_reset_tokens, hour_projections |
| Finanzas (5) | periods, revenues, admin_expenses, sales_costs, personnel_costs |
| Comercial (1) | commercial_records |
| **Total: 30 tablas** | *(income_categories eliminada en 2026-05-22)* | |
| **Total** | **31 tablas** |

> `document_types` se cuenta en Configuración (catálogo). Comercial = `commercial_records` (+ `document_types`).

---

## Archivos SQL

```bash
# Setup completo (base limpia):
psql "<connection_string>" -f .ai/db/schema.sql
psql "<connection_string>" -f .ai/db/data.sql
```

- **`schema.sql`** — DDL completo: DROP + CREATE de las 31 tablas, índices y constraints (inglés, inline, auditoría tiered). Fuente de verdad.
- **`data.sql`** — Solo datos: catálogos, `periods`, `document_types`, usuario admin inicial. Se ejecuta después de `schema.sql`.
- **`migrations_archive/`** — Historial de migraciones individuales (001–021), solo referencia.
- **`setup_schema.sql` / `setup_seeds.sql`** — ⚠️ Legacy/obsoletos, reemplazados. Pendientes de borrar.
