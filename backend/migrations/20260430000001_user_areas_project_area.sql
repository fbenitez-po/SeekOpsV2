-- Migration: 004_user_areas_project_area.sql
-- Descripción: Soporte de múltiples áreas por usuario + área opcional en proyectos
-- Fecha: 2026-04-30
-- ¿Requiere downtime? No
-- ¿Pérdida de datos potencial? No (la migración de datos es automática)
-- Dependencias: 001, 002, 003 deben ejecutarse primero

-- ============================================
-- UP
-- ============================================
-- Tabla: user_areas (M2M entre users y areas)
-- Un usuario debe tener al menos un área (validado en aplicación).
-- Reemplaza el campo area_id en users.
CREATE TABLE user_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  area_id UUID NOT NULL REFERENCES areas(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, area_id)
);

CREATE INDEX idx_user_areas_user_id ON user_areas(user_id);
CREATE INDEX idx_user_areas_area_id ON user_areas(area_id);

-- Migrar datos existentes: copiar el area_id actual de cada user a user_areas
INSERT INTO user_areas (user_id, area_id)
SELECT id, area_id FROM users WHERE area_id IS NOT NULL;

-- Eliminar el campo area_id de users (ya reemplazado por user_areas)
ALTER TABLE users DROP COLUMN area_id;

-- Agregar area_id opcional a projects
-- Un proyecto puede aplicar a un área específica (seleccionable via checkbox en UI)
ALTER TABLE projects ADD COLUMN area_id UUID REFERENCES areas(id);
CREATE INDEX idx_projects_area_id ON projects(area_id);
-- ============================================
-- DOWN
-- ============================================

-- BEGIN;
-- -- Revertir: restaurar area_id en users (tomar la primera área de user_areas)
-- ALTER TABLE users ADD COLUMN area_id UUID REFERENCES areas(id);
-- UPDATE users u SET area_id = (SELECT area_id FROM user_areas WHERE user_id = u.id LIMIT 1);
-- -- Eliminar tabla y columna agregados
-- DROP INDEX IF EXISTS idx_projects_area_id;
-- ALTER TABLE projects DROP COLUMN IF EXISTS area_id;
-- DROP TABLE IF EXISTS user_areas;
-- COMMIT;