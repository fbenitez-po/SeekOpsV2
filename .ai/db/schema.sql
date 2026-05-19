-- ============================================================
-- SEEKOPS — Schema (tables, constraints, indexes)
-- Run this BEFORE data.sql.
-- WARNING: drops and recreates the public schema. Not for production.
-- ============================================================

DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO PUBLIC;

BEGIN;

-- Config / lookup tables ------------------------------------

CREATE TABLE IF NOT EXISTS income_categories (
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
CREATE INDEX IF NOT EXISTS idx_income_categories_code ON income_categories(code);

CREATE TABLE IF NOT EXISTS work_categories (
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
CREATE INDEX IF NOT EXISTS idx_work_categories_code ON work_categories(code);

CREATE TABLE IF NOT EXISTS service_types (
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
CREATE INDEX IF NOT EXISTS idx_service_types_code ON service_types(code);

CREATE TABLE IF NOT EXISTS client_segmentations (
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
CREATE INDEX IF NOT EXISTS idx_client_segmentations_code ON client_segmentations(code);

CREATE TABLE IF NOT EXISTS client_sectors (
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
CREATE INDEX IF NOT EXISTS idx_client_sectors_code ON client_sectors(code);

CREATE TABLE IF NOT EXISTS teams (
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
CREATE INDEX IF NOT EXISTS idx_teams_code ON teams(code);

CREATE TABLE IF NOT EXISTS areas (
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
CREATE INDEX IF NOT EXISTS idx_areas_code ON areas(code);

CREATE TABLE IF NOT EXISTS project_segmentation (
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
CREATE INDEX IF NOT EXISTS idx_project_segmentation_code ON project_segmentation(code);

CREATE TABLE IF NOT EXISTS project_categories (
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
CREATE INDEX IF NOT EXISTS idx_project_categories_code ON project_categories(code);

CREATE TABLE IF NOT EXISTS productivity_layers (
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
CREATE INDEX IF NOT EXISTS idx_productivity_layers_code ON productivity_layers(code);

-- Core tables -----------------------------------------------

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

-- Bridge tables ---------------------------------------------

CREATE TABLE IF NOT EXISTS user_area (
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  area_id    UUID NOT NULL REFERENCES areas(id),
  created_at TIMESTAMP   NOT NULL DEFAULT NOW(),
  created_by VARCHAR(50) NOT NULL DEFAULT 'admin',
  PRIMARY KEY (user_id, area_id)
);
CREATE INDEX IF NOT EXISTS idx_user_area_user_id ON user_area(user_id);
CREATE INDEX IF NOT EXISTS idx_user_area_area_id ON user_area(area_id);

CREATE TABLE IF NOT EXISTS user_profile (
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP   NOT NULL DEFAULT NOW(),
  created_by VARCHAR(50) NOT NULL DEFAULT 'admin',
  PRIMARY KEY (user_id, profile_id)
);
CREATE INDEX IF NOT EXISTS idx_user_profile_user_id    ON user_profile(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profile_profile_id ON user_profile(profile_id);

CREATE TABLE IF NOT EXISTS project_project_category (
  project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  project_category_id UUID NOT NULL REFERENCES project_categories(id),
  created_at          TIMESTAMP   NOT NULL DEFAULT NOW(),
  created_by          VARCHAR(50) NOT NULL DEFAULT 'admin',
  PRIMARY KEY (project_id, project_category_id)
);
CREATE INDEX IF NOT EXISTS idx_project_project_category_project_id  ON project_project_category(project_id);
CREATE INDEX IF NOT EXISTS idx_project_project_category_category_id ON project_project_category(project_category_id);

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

-- Transactional tables --------------------------------------

CREATE TABLE IF NOT EXISTS time_entries (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week       VARCHAR(10) NOT NULL,
  status     VARCHAR(50) NOT NULL DEFAULT 'PENDIENTE',
  created_at TIMESTAMP   NOT NULL DEFAULT NOW(),
  created_by VARCHAR(50) NOT NULL DEFAULT 'admin',
  updated_at TIMESTAMP,
  updated_by VARCHAR(50),
  deleted_at TIMESTAMP,
  deleted_by VARCHAR(50),
  is_active  BOOLEAN     NOT NULL DEFAULT true
);
CREATE INDEX IF NOT EXISTS idx_time_entries_user_id   ON time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_week      ON time_entries(week);
CREATE INDEX IF NOT EXISTS idx_time_entries_status    ON time_entries(status);
CREATE INDEX IF NOT EXISTS idx_time_entries_user_week ON time_entries(user_id, week);

CREATE TABLE IF NOT EXISTS time_entry_lines (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  time_entry_id      UUID NOT NULL REFERENCES time_entries(id) ON DELETE CASCADE,
  project_id         UUID NOT NULL REFERENCES projects(id),
  income_category_id UUID REFERENCES income_categories(id),
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

CREATE TABLE IF NOT EXISTS time_entry_approvals (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  time_entry_id         UUID NOT NULL REFERENCES time_entries(id) ON DELETE CASCADE,
  action                VARCHAR(50) NOT NULL,
  comment               TEXT,
  suggested_hours       NUMERIC(6,1),
  suggested_extra_hours NUMERIC(4,1),
  rejection_reason      TEXT,
  can_resubmit          BOOLEAN DEFAULT true,
  created_at            TIMESTAMP   NOT NULL DEFAULT NOW(),
  created_by            VARCHAR(50) NOT NULL DEFAULT 'admin'
);
CREATE INDEX IF NOT EXISTS idx_time_entry_approvals_time_entry_id ON time_entry_approvals(time_entry_id);
CREATE INDEX IF NOT EXISTS idx_time_entry_approvals_created_by    ON time_entry_approvals(created_by);
CREATE INDEX IF NOT EXISTS idx_time_entry_approvals_action        ON time_entry_approvals(action);
CREATE INDEX IF NOT EXISTS idx_time_entry_approvals_created_at    ON time_entry_approvals(created_at);

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

-- Finance ---------------------------------------------------

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

CREATE TABLE IF NOT EXISTS sales_costs (
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
  CONSTRAINT check_sales_costs_amount CHECK (amount >= 0)
);
CREATE INDEX IF NOT EXISTS idx_sales_costs_period_id ON sales_costs(period_id);

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

-- Commercial ------------------------------------------------

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

COMMIT;
