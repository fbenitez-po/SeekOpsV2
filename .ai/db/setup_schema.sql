-- ============================================================
-- SEEKOPS — Schema: tablas, índices y constraints
-- Ejecutar primero, antes de setup_seeds.sql
--
-- ADVERTENCIA: Este script BORRA todo el esquema y lo recrea.
-- No ejecutar en producción con datos reales.
--
-- Uso:
--   psql "<connection_string>" -f setup_schema.sql
--   psql "<connection_string>" -f setup_seeds.sql
-- ============================================================

DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO PUBLIC;

BEGIN;

-- ── Tablas de configuración ──────────────────────────────────

CREATE TABLE income_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo      VARCHAR(50)  NOT NULL UNIQUE,
  name        VARCHAR(100) NOT NULL,
  descripcion TEXT,
  activo      BOOLEAN   NOT NULL DEFAULT true,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_income_categories_codigo ON income_categories(codigo);

CREATE TABLE client_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo      VARCHAR(50)  NOT NULL UNIQUE,
  name        VARCHAR(100) NOT NULL,
  descripcion TEXT,
  activo      BOOLEAN   NOT NULL DEFAULT true,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_client_categories_codigo ON client_categories(codigo);

CREATE TABLE service_types (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo      VARCHAR(50)  NOT NULL UNIQUE,
  nombre      VARCHAR(100) NOT NULL,
  descripcion TEXT,
  activo      BOOLEAN   NOT NULL DEFAULT true,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_service_types_codigo ON service_types(codigo);

CREATE TABLE client_segmentations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo      VARCHAR(50)  NOT NULL UNIQUE,
  nombre      VARCHAR(100) NOT NULL,
  descripcion TEXT,
  activo      BOOLEAN   NOT NULL DEFAULT true,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_client_segmentations_codigo ON client_segmentations(codigo);

CREATE TABLE client_sectors (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo      VARCHAR(50)  NOT NULL UNIQUE,
  nombre      VARCHAR(100) NOT NULL,
  descripcion TEXT,
  activo      BOOLEAN   NOT NULL DEFAULT true,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_client_sectors_codigo ON client_sectors(codigo);

CREATE TABLE teams (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo      VARCHAR(50)  NOT NULL UNIQUE,
  name        VARCHAR(100) NOT NULL,
  descripcion TEXT,
  activo      BOOLEAN   NOT NULL DEFAULT true,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_teams_codigo ON teams(codigo);

CREATE TABLE areas (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo      VARCHAR(50)  NOT NULL UNIQUE,
  name        VARCHAR(100) NOT NULL,
  descripcion TEXT,
  activo      BOOLEAN   NOT NULL DEFAULT true,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_areas_codigo ON areas(codigo);

CREATE TABLE project_segmentation (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo      VARCHAR(50)  NOT NULL UNIQUE,
  nombre      VARCHAR(100) NOT NULL,
  descripcion TEXT,
  activo      BOOLEAN   NOT NULL DEFAULT true,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_project_segmentation_codigo ON project_segmentation(codigo);

CREATE TABLE project_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo      VARCHAR(50)  NOT NULL UNIQUE,
  nombre      VARCHAR(100) NOT NULL,
  descripcion TEXT,
  activo      BOOLEAN   NOT NULL DEFAULT true,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_project_categories_codigo ON project_categories(codigo);

CREATE TABLE productivity_layers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo      VARCHAR(50)  NOT NULL UNIQUE,
  nombre      VARCHAR(100) NOT NULL,
  descripcion TEXT,
  activo      BOOLEAN   NOT NULL DEFAULT true,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_productivity_layers_codigo ON productivity_layers(codigo);

-- ── Tablas core ──────────────────────────────────────────────

CREATE TABLE users (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email            VARCHAR(255) NOT NULL UNIQUE,
  password_hash    VARCHAR(255) NOT NULL DEFAULT '$placeholder$',
  numero_documento VARCHAR(20)  NOT NULL UNIQUE,
  nombres          VARCHAR(100) NOT NULL,
  apellidos        VARCHAR(100) NOT NULL,
  puesto           VARCHAR(100) NOT NULL,
  celular          VARCHAR(20),
  avatar_url       VARCHAR(500),
  team_id          UUID NOT NULL REFERENCES teams(id),
  fecha_ingreso    DATE NOT NULL,
  activo           BOOLEAN   NOT NULL DEFAULT true,
  staff            BOOLEAN   NOT NULL DEFAULT false,
  super_usuario    BOOLEAN   NOT NULL DEFAULT false,
  deactivated_at   TIMESTAMP,
  created_at       TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by       UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by       UUID REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX idx_users_email            ON users(email);
CREATE INDEX idx_users_numero_documento ON users(numero_documento);
CREATE INDEX idx_users_activo           ON users(activo);
CREATE INDEX idx_users_team_id          ON users(team_id);

CREATE TABLE user_groups (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo      VARCHAR(50)  NOT NULL UNIQUE,
  nombre      VARCHAR(100) NOT NULL,
  descripcion TEXT,
  activo      BOOLEAN   NOT NULL DEFAULT true,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_user_groups_codigo ON user_groups(codigo);

CREATE TABLE clients (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre             VARCHAR(100) NOT NULL,
  razon_social       VARCHAR(150),
  razon_comercial    VARCHAR(150),
  ruc                VARCHAR(14)  NOT NULL UNIQUE,
  nombre_contacto    VARCHAR(100),
  email_contacto     VARCHAR(255),
  telefono           VARCHAR(20),
  direccion          VARCHAR(200),
  client_category_id UUID NOT NULL REFERENCES client_categories(id),
  segmentation_id    UUID NOT NULL REFERENCES client_segmentations(id),
  sector_id          UUID REFERENCES client_sectors(id),
  activo             BOOLEAN   NOT NULL DEFAULT true,
  created_at         TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by         UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by         UUID REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX idx_clients_ruc             ON clients(ruc);
CREATE INDEX idx_clients_activo          ON clients(activo);
CREATE INDEX idx_clients_segmentation_id ON clients(segmentation_id);
CREATE INDEX idx_clients_sector_id       ON clients(sector_id);

CREATE TABLE projects (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code                    VARCHAR(20)  NOT NULL UNIQUE,
  nombre                  VARCHAR(100) NOT NULL,
  descripcion             TEXT,
  client_id               UUID NOT NULL REFERENCES clients(id),
  project_segmentation_id UUID NOT NULL REFERENCES project_segmentation(id),
  productivity_layer_id   UUID REFERENCES productivity_layers(id),
  service_type_id         UUID REFERENCES service_types(id),
  area_id                 UUID REFERENCES areas(id),
  gestor_id               UUID NOT NULL REFERENCES users(id),
  fecha_inicio            DATE,
  fecha_fin               DATE,
  activo                  BOOLEAN   NOT NULL DEFAULT true,
  created_at              TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by              UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by              UUID REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT check_fecha_fin_mayor_inicio
    CHECK (fecha_fin IS NULL OR fecha_inicio IS NULL OR fecha_fin >= fecha_inicio)
);
CREATE INDEX idx_projects_code                    ON projects(code);
CREATE INDEX idx_projects_client_id               ON projects(client_id);
CREATE INDEX idx_projects_gestor_id               ON projects(gestor_id);
CREATE INDEX idx_projects_activo                  ON projects(activo);
CREATE INDEX idx_projects_project_segmentation_id ON projects(project_segmentation_id);
CREATE INDEX idx_projects_area_id                 ON projects(area_id);

-- ── Relaciones M2M ───────────────────────────────────────────

CREATE TABLE user_areas (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  area_id    UUID NOT NULL REFERENCES areas(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, area_id)
);
CREATE INDEX idx_user_areas_user_id ON user_areas(user_id);
CREATE INDEX idx_user_areas_area_id ON user_areas(area_id);

CREATE TABLE user_group_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  group_id   UUID NOT NULL REFERENCES user_groups(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, group_id)
);
CREATE INDEX idx_user_group_members_user_id  ON user_group_members(user_id);
CREATE INDEX idx_user_group_members_group_id ON user_group_members(group_id);

CREATE TABLE project_project_categories (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  project_category_id UUID NOT NULL REFERENCES project_categories(id),
  created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, project_category_id)
);
CREATE INDEX idx_ppc_project_id  ON project_project_categories(project_id);
CREATE INDEX idx_ppc_category_id ON project_project_categories(project_category_id);

CREATE TABLE project_users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rol        VARCHAR(50) NOT NULL,
  activo     BOOLEAN   NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, user_id, rol)
);
CREATE INDEX idx_project_users_project_id ON project_users(project_id);
CREATE INDEX idx_project_users_user_id    ON project_users(user_id);
CREATE INDEX idx_project_users_activo     ON project_users(activo);

-- ── Tablas transaccionales ───────────────────────────────────

CREATE TABLE time_entries (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  semana             VARCHAR(10) NOT NULL,
  estado             VARCHAR(50) NOT NULL DEFAULT 'PENDIENTE',
  created_at         TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX idx_time_entries_user_id     ON time_entries(user_id);
CREATE INDEX idx_time_entries_semana      ON time_entries(semana);
CREATE INDEX idx_time_entries_estado      ON time_entries(estado);
CREATE INDEX idx_time_entries_user_semana ON time_entries(user_id, semana);

CREATE TABLE time_entry_lines (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  time_entry_id      UUID NOT NULL REFERENCES time_entries(id) ON DELETE CASCADE,
  project_id         UUID NOT NULL REFERENCES projects(id),
  income_category_id UUID REFERENCES income_categories(id),
  hours              INTEGER NOT NULL,
  extra_hours        INTEGER NOT NULL DEFAULT 0,
  comment            TEXT,
  created_at         TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT check_hours_range       CHECK (hours >= 0),
  CONSTRAINT check_extra_hours_range CHECK (extra_hours >= 0 AND extra_hours <= 8)
);
CREATE INDEX idx_time_entry_lines_time_entry_id ON time_entry_lines(time_entry_id);
CREATE INDEX idx_time_entry_lines_project_id    ON time_entry_lines(project_id);

CREATE TABLE time_entry_approvals (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  time_entry_id         UUID NOT NULL REFERENCES time_entries(id) ON DELETE CASCADE,
  action                VARCHAR(50) NOT NULL,
  comment               TEXT,
  suggested_hours       INTEGER,
  suggested_extra_hours INTEGER,
  rejection_reason      TEXT,
  allow_resubmit        BOOLEAN DEFAULT true,
  created_at            TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by_user_id    UUID REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX idx_time_entry_approvals_time_entry_id ON time_entry_approvals(time_entry_id);
CREATE INDEX idx_time_entry_approvals_created_by    ON time_entry_approvals(created_by_user_id);
CREATE INDEX idx_time_entry_approvals_action        ON time_entry_approvals(action);
CREATE INDEX idx_time_entry_approvals_created_at    ON time_entry_approvals(created_at);

CREATE TABLE refresh_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  token      TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);

CREATE TABLE password_reset_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  token      TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);

CREATE TABLE hour_projections (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id         UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id            UUID NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  fecha_inicio       DATE    NOT NULL,
  fecha_fin          DATE    NOT NULL,
  horas_proyectadas  INTEGER NOT NULL,
  notas              TEXT,
  created_at         TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT check_projection_dates  CHECK (fecha_fin >= fecha_inicio),
  CONSTRAINT check_horas_proyectadas CHECK (horas_proyectadas > 0)
);
CREATE INDEX idx_hour_projections_project_id   ON hour_projections(project_id);
CREATE INDEX idx_hour_projections_user_id      ON hour_projections(user_id);
CREATE INDEX idx_hour_projections_project_user ON hour_projections(project_id, user_id);
CREATE INDEX idx_hour_projections_fechas       ON hour_projections(fecha_inicio, fecha_fin);

COMMIT;
