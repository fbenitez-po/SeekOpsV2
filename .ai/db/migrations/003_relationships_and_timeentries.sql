-- Migration: 003_relationships_and_timeentries.sql
-- Descripción: Crear relaciones M2M, time_entries y tablas de tokens de autenticación
-- Fecha: 2026-04-23
-- ¿Requiere downtime? No
-- ¿Pérdida de datos potencial? No
-- Dependencias: 001 + 002 deben ejecutarse primero

-- ============================================
-- UP: Crear relaciones y time_entries
-- ============================================

BEGIN;

-- Tabla: user_group_members (M2M: usuarios ↔ grupos)
-- Columnas: user_id, group_id (coinciden con data layer)
CREATE TABLE user_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES user_groups(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, group_id)
);

CREATE INDEX idx_user_group_members_user_id ON user_group_members(user_id);
CREATE INDEX idx_user_group_members_group_id ON user_group_members(group_id);

-- Asignar admin seed al grupo ADMIN
INSERT INTO user_group_members (user_id, group_id)
SELECT u.id, ug.id
FROM users u, user_groups ug
WHERE u.email = 'admin@seekglobal.co' AND ug.codigo = 'ADMIN';

-- Tabla: project_users (M2M: usuarios ↔ proyectos con rol de texto)
-- rol: texto libre (SEEKER o GESTOR) — no FK, permite flexibilidad
CREATE TABLE project_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rol VARCHAR(50) NOT NULL,

  activo BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  UNIQUE(project_id, user_id, rol)
);

CREATE INDEX idx_project_users_project_id ON project_users(project_id);
CREATE INDEX idx_project_users_user_id ON project_users(user_id);
CREATE INDEX idx_project_users_activo ON project_users(activo);

-- Tabla: time_entries (cabecera del registro semanal de horas)
-- estado: texto directo (PENDIENTE, APROBADO, OBSERVADO, RECHAZADO) — más simple que FK
-- user_id, created_by_user_id, updated_by_user_id: coinciden con data layer
CREATE TABLE time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  semana VARCHAR(10) NOT NULL,
  estado VARCHAR(50) NOT NULL DEFAULT 'PENDIENTE',

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_time_entries_user_id ON time_entries(user_id);
CREATE INDEX idx_time_entries_semana ON time_entries(semana);
CREATE INDEX idx_time_entries_estado ON time_entries(estado);
CREATE INDEX idx_time_entries_user_semana ON time_entries(user_id, semana);

-- Tabla: time_entry_lines (líneas de detalle: proyecto, horas, categoría)
-- Columnas en inglés: project_id, hours, extra_hours, comment — coinciden con data layer
CREATE TABLE time_entry_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  time_entry_id UUID NOT NULL REFERENCES time_entries(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id),
  income_category_id UUID REFERENCES income_categories(id),

  hours INTEGER NOT NULL,
  extra_hours INTEGER NOT NULL DEFAULT 0,
  comment TEXT,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT check_hours_range CHECK (hours >= 0 AND hours <= 24),
  CONSTRAINT check_extra_hours_range CHECK (extra_hours >= 0 AND extra_hours <= 8)
);

CREATE INDEX idx_time_entry_lines_time_entry_id ON time_entry_lines(time_entry_id);
CREATE INDEX idx_time_entry_lines_project_id ON time_entry_lines(project_id);

-- Tabla: time_entry_approvals (historial de aprobaciones/observaciones/rechazos)
-- Columnas en inglés — coinciden con data layer
CREATE TABLE time_entry_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  time_entry_id UUID NOT NULL REFERENCES time_entries(id) ON DELETE CASCADE,

  action VARCHAR(50) NOT NULL,
  comment TEXT,
  suggested_hours INTEGER,
  suggested_extra_hours INTEGER,
  rejection_reason TEXT,
  allow_resubmit BOOLEAN DEFAULT true,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_time_entry_approvals_time_entry_id ON time_entry_approvals(time_entry_id);
CREATE INDEX idx_time_entry_approvals_created_by ON time_entry_approvals(created_by_user_id);
CREATE INDEX idx_time_entry_approvals_action ON time_entry_approvals(action);
CREATE INDEX idx_time_entry_approvals_created_at ON time_entry_approvals(created_at);

-- Tabla: refresh_tokens (tokens JWT de refresco, uno por usuario)
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);

-- Tabla: password_reset_tokens (tokens temporales de reset de contraseña, uno por usuario)
CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);

COMMIT;

-- ============================================
-- DOWN: Eliminar relaciones y time_entries
-- ============================================

-- BEGIN;
-- DROP TABLE IF EXISTS password_reset_tokens CASCADE;
-- DROP TABLE IF EXISTS refresh_tokens CASCADE;
-- DROP TABLE IF EXISTS time_entry_approvals CASCADE;
-- DROP TABLE IF EXISTS time_entry_lines CASCADE;
-- DROP TABLE IF EXISTS time_entries CASCADE;
-- DROP TABLE IF EXISTS project_users CASCADE;
-- DROP TABLE IF EXISTS user_group_members CASCADE;
-- COMMIT;
