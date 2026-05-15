-- Migration: 015_ingresos.sql
-- Descripción: Tabla de ingresos por proyecto y período
-- Fecha: 2026-05-11
-- ¿Requiere downtime? No
-- ¿Pérdida de datos potencial? No
-- Dependencias: 002 (projects), 014 (periodos)

-- ============================================
-- UP: Crear tabla ingresos
-- ============================================

BEGIN;

CREATE TABLE ingresos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  proyecto_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  periodo_id  UUID NOT NULL REFERENCES periodos(id) ON DELETE CASCADE,
  monto       NUMERIC(14,2) NOT NULL CHECK (monto >= 0),

  created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by_user_id  UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by_user_id  UUID REFERENCES users(id) ON DELETE SET NULL,

  CONSTRAINT uq_ingresos_proyecto_periodo UNIQUE (proyecto_id, periodo_id)
);

CREATE INDEX idx_ingresos_proyecto_id ON ingresos(proyecto_id);
CREATE INDEX idx_ingresos_periodo_id  ON ingresos(periodo_id);

COMMIT;

-- ============================================
-- DOWN: Eliminar tabla ingresos
-- ============================================

-- BEGIN;
-- DROP TABLE IF EXISTS ingresos CASCADE;
-- COMMIT;
