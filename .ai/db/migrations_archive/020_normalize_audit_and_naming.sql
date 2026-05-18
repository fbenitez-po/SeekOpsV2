-- ============================================================
-- Migración 020 — Normalizar nombres y auditoría
-- Aplica los pendientes técnicos #5, #6 y #8
--
-- #5: Renombrar nombre → name en 6 tablas lookup
-- #6: Renombrar activo → enabled en todas las tablas
--      Estandarizar columnas de auditoría (created_by/updated_by
--      como VARCHAR(255) email, no FK UUID)
--      Agregar deleted_at / deleted_by en tablas con baja lógica
-- #8: updated_at en time_entry_lines lo setea el BE (solo código)
-- ============================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────
-- #5: Renombrar nombre → name en 6 tablas lookup
-- ─────────────────────────────────────────────────────────────

ALTER TABLE service_types        RENAME COLUMN nombre TO name;
ALTER TABLE client_segmentations RENAME COLUMN nombre TO name;
ALTER TABLE client_sectors       RENAME COLUMN nombre TO name;
ALTER TABLE project_segmentation RENAME COLUMN nombre TO name;
ALTER TABLE project_categories   RENAME COLUMN nombre TO name;
ALTER TABLE productivity_layers  RENAME COLUMN nombre TO name;

-- ─────────────────────────────────────────────────────────────
-- #6a: Renombrar activo → enabled en todas las tablas
-- ─────────────────────────────────────────────────────────────

ALTER TABLE income_categories    RENAME COLUMN activo TO enabled;
ALTER TABLE client_categories    RENAME COLUMN activo TO enabled;
ALTER TABLE service_types        RENAME COLUMN activo TO enabled;
ALTER TABLE client_segmentations RENAME COLUMN activo TO enabled;
ALTER TABLE client_sectors       RENAME COLUMN activo TO enabled;
ALTER TABLE teams                RENAME COLUMN activo TO enabled;
ALTER TABLE areas                RENAME COLUMN activo TO enabled;
ALTER TABLE project_segmentation RENAME COLUMN activo TO enabled;
ALTER TABLE project_categories   RENAME COLUMN activo TO enabled;
ALTER TABLE productivity_layers  RENAME COLUMN activo TO enabled;
ALTER TABLE users                RENAME COLUMN activo TO enabled;
ALTER TABLE user_groups          RENAME COLUMN activo TO enabled;
ALTER TABLE clients              RENAME COLUMN activo TO enabled;
ALTER TABLE projects             RENAME COLUMN activo TO enabled;
ALTER TABLE project_users        RENAME COLUMN activo TO enabled;
ALTER TABLE tipos_documento      RENAME COLUMN activo TO enabled;

-- ─────────────────────────────────────────────────────────────
-- #6b: Agregar deleted_at / deleted_by en tablas con baja lógica
-- ─────────────────────────────────────────────────────────────

-- users: renombrar deactivated_at → deleted_at, agregar deleted_by
ALTER TABLE users RENAME COLUMN deactivated_at TO deleted_at;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(255);

-- clients / projects: agregar ambas columnas
ALTER TABLE clients  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE clients  ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(255);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(255);

-- ─────────────────────────────────────────────────────────────
-- #6c: Estandarizar created_by / updated_by
--       UUID FK → VARCHAR(255) con email
-- ─────────────────────────────────────────────────────────────

-- users.created_by / updated_by (UUID FK → VARCHAR)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_created_by_fkey;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_updated_by_fkey;
ALTER TABLE users ALTER COLUMN created_by TYPE VARCHAR(255) USING NULL;
ALTER TABLE users ALTER COLUMN updated_by TYPE VARCHAR(255) USING NULL;

-- clients.created_by / updated_by
ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_created_by_fkey;
ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_updated_by_fkey;
ALTER TABLE clients ALTER COLUMN created_by TYPE VARCHAR(255) USING NULL;
ALTER TABLE clients ALTER COLUMN updated_by TYPE VARCHAR(255) USING NULL;

-- projects.created_by / updated_by
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_created_by_fkey;
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_updated_by_fkey;
ALTER TABLE projects ALTER COLUMN created_by TYPE VARCHAR(255) USING NULL;
ALTER TABLE projects ALTER COLUMN updated_by TYPE VARCHAR(255) USING NULL;

-- registros_comerciales.created_by / updated_by
ALTER TABLE registros_comerciales DROP CONSTRAINT IF EXISTS registros_comerciales_created_by_fkey;
ALTER TABLE registros_comerciales DROP CONSTRAINT IF EXISTS registros_comerciales_updated_by_fkey;
ALTER TABLE registros_comerciales ALTER COLUMN created_by TYPE VARCHAR(255) USING NULL;
ALTER TABLE registros_comerciales ALTER COLUMN updated_by TYPE VARCHAR(255) USING NULL;

-- ─────────────────────────────────────────────────────────────
-- #6d: Renombrar *_user_id → created_by / updated_by (VARCHAR)
-- ─────────────────────────────────────────────────────────────

-- time_entries
ALTER TABLE time_entries DROP CONSTRAINT IF EXISTS time_entries_created_by_user_id_fkey;
ALTER TABLE time_entries DROP CONSTRAINT IF EXISTS time_entries_updated_by_user_id_fkey;
ALTER TABLE time_entries ALTER COLUMN created_by_user_id TYPE VARCHAR(255) USING NULL;
ALTER TABLE time_entries ALTER COLUMN updated_by_user_id TYPE VARCHAR(255) USING NULL;
ALTER TABLE time_entries RENAME COLUMN created_by_user_id TO created_by;
ALTER TABLE time_entries RENAME COLUMN updated_by_user_id TO updated_by;

-- time_entry_approvals
ALTER TABLE time_entry_approvals DROP CONSTRAINT IF EXISTS time_entry_approvals_created_by_user_id_fkey;
ALTER TABLE time_entry_approvals ALTER COLUMN created_by_user_id TYPE VARCHAR(255) USING NULL;
ALTER TABLE time_entry_approvals RENAME COLUMN created_by_user_id TO created_by;

-- hour_projections
ALTER TABLE hour_projections DROP CONSTRAINT IF EXISTS hour_projections_created_by_user_id_fkey;
ALTER TABLE hour_projections DROP CONSTRAINT IF EXISTS hour_projections_updated_by_user_id_fkey;
ALTER TABLE hour_projections ALTER COLUMN created_by_user_id TYPE VARCHAR(255) USING NULL;
ALTER TABLE hour_projections ALTER COLUMN updated_by_user_id TYPE VARCHAR(255) USING NULL;
ALTER TABLE hour_projections RENAME COLUMN created_by_user_id TO created_by;
ALTER TABLE hour_projections RENAME COLUMN updated_by_user_id TO updated_by;

-- ingresos
ALTER TABLE ingresos DROP CONSTRAINT IF EXISTS ingresos_created_by_user_id_fkey;
ALTER TABLE ingresos DROP CONSTRAINT IF EXISTS ingresos_updated_by_user_id_fkey;
ALTER TABLE ingresos ALTER COLUMN created_by_user_id TYPE VARCHAR(255) USING NULL;
ALTER TABLE ingresos ALTER COLUMN updated_by_user_id TYPE VARCHAR(255) USING NULL;
ALTER TABLE ingresos RENAME COLUMN created_by_user_id TO created_by;
ALTER TABLE ingresos RENAME COLUMN updated_by_user_id TO updated_by;

-- gastos_admin
ALTER TABLE gastos_admin DROP CONSTRAINT IF EXISTS gastos_admin_created_by_user_id_fkey;
ALTER TABLE gastos_admin DROP CONSTRAINT IF EXISTS gastos_admin_updated_by_user_id_fkey;
ALTER TABLE gastos_admin ALTER COLUMN created_by_user_id TYPE VARCHAR(255) USING NULL;
ALTER TABLE gastos_admin ALTER COLUMN updated_by_user_id TYPE VARCHAR(255) USING NULL;
ALTER TABLE gastos_admin RENAME COLUMN created_by_user_id TO created_by;
ALTER TABLE gastos_admin RENAME COLUMN updated_by_user_id TO updated_by;

-- costos_venta
ALTER TABLE costos_venta DROP CONSTRAINT IF EXISTS costos_venta_created_by_user_id_fkey;
ALTER TABLE costos_venta DROP CONSTRAINT IF EXISTS costos_venta_updated_by_user_id_fkey;
ALTER TABLE costos_venta ALTER COLUMN created_by_user_id TYPE VARCHAR(255) USING NULL;
ALTER TABLE costos_venta ALTER COLUMN updated_by_user_id TYPE VARCHAR(255) USING NULL;
ALTER TABLE costos_venta RENAME COLUMN created_by_user_id TO created_by;
ALTER TABLE costos_venta RENAME COLUMN updated_by_user_id TO updated_by;

-- costos_por_persona
ALTER TABLE costos_por_persona DROP CONSTRAINT IF EXISTS costos_por_persona_created_by_user_id_fkey;
ALTER TABLE costos_por_persona DROP CONSTRAINT IF EXISTS costos_por_persona_updated_by_user_id_fkey;
ALTER TABLE costos_por_persona ALTER COLUMN created_by_user_id TYPE VARCHAR(255) USING NULL;
ALTER TABLE costos_por_persona ALTER COLUMN updated_by_user_id TYPE VARCHAR(255) USING NULL;
ALTER TABLE costos_por_persona RENAME COLUMN created_by_user_id TO created_by;
ALTER TABLE costos_por_persona RENAME COLUMN updated_by_user_id TO updated_by;

COMMIT;
