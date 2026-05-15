-- Migration: 016_gastos_admin.sql
-- Descripción: Tabla de gastos administrativos por período
-- Fecha: 2026-05-11
-- ¿Requiere downtime? No
-- ¿Pérdida de datos potencial? No
-- Dependencias: 014 (periodos)

-- ============================================
-- UP: Crear tabla gastos_admin
-- ============================================

BEGIN;

CREATE TABLE gastos_admin (
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

CREATE INDEX idx_gastos_admin_periodo_id ON gastos_admin(periodo_id);

COMMIT;

-- ============================================
-- DOWN: Eliminar tabla gastos_admin
-- ============================================

-- BEGIN;
-- DROP TABLE IF EXISTS gastos_admin CASCADE;
-- COMMIT;
