-- Migration: 008_hour_projections.sql
-- Descripción: Tabla de proyecciones de horas por usuario/proyecto
-- Fecha: 2026-05-04
-- ¿Requiere downtime? No
-- ¿Pérdida de datos potencial? No
-- Dependencias: 002 (projects, users) debe ejecutarse primero

-- ============================================
-- UP: Crear tabla hour_projections
-- ============================================
-- Tabla: hour_projections
-- Almacena rangos de horas proyectadas para un usuario en un proyecto.
-- Usada para comparar proyectado vs. real y detectar cargas sin proyección.
CREATE TABLE hour_projections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id)    ON DELETE CASCADE,

  fecha_inicio      DATE    NOT NULL,
  fecha_fin         DATE    NOT NULL,
  horas_proyectadas INTEGER NOT NULL,
  notas             TEXT,

  created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by_user_id  UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by_user_id  UUID REFERENCES users(id) ON DELETE SET NULL,

  CONSTRAINT check_projection_dates   CHECK (fecha_fin >= fecha_inicio),
  CONSTRAINT check_horas_proyectadas  CHECK (horas_proyectadas > 0)
);

CREATE INDEX idx_hour_projections_project_id   ON hour_projections(project_id);
CREATE INDEX idx_hour_projections_user_id      ON hour_projections(user_id);
CREATE INDEX idx_hour_projections_project_user ON hour_projections(project_id, user_id);
CREATE INDEX idx_hour_projections_fechas       ON hour_projections(fecha_inicio, fecha_fin);
-- ============================================
-- DOWN: Eliminar tabla hour_projections
-- ============================================

-- BEGIN;
-- DROP TABLE IF EXISTS hour_projections CASCADE;
-- COMMIT;
