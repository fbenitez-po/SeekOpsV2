-- Migration: 017_costos_venta.sql
-- Descripción: Tabla de costos de venta por período
-- Fecha: 2026-05-11
-- ¿Requiere downtime? No
-- ¿Pérdida de datos potencial? No
-- Dependencias: 014 (periodos)

-- ============================================
-- UP: Crear tabla costos_venta
-- ============================================

BEGIN;

CREATE TABLE costos_venta (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  periodo_id  UUID NOT NULL REFERENCES periodos(id) ON DELETE CASCADE,
  codigo      VARCHAR(50) NOT NULL,
  descripcion VARCHAR(255),
  monto       NUMERIC(14,2) NOT NULL CHECK (monto >= 0),

  created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by_user_id  UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by_user_id  UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_costos_venta_periodo_id ON costos_venta(periodo_id);

COMMIT;

-- ============================================
-- DOWN: Eliminar tabla costos_venta
-- ============================================

-- BEGIN;
-- DROP TABLE IF EXISTS costos_venta CASCADE;
-- COMMIT;
