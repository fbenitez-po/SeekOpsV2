-- Migration: 018_costos_por_persona.sql
-- Descripción: Tabla de costos por persona (remuneración) por período
-- Fecha: 2026-05-11
-- ¿Requiere downtime? No
-- ¿Pérdida de datos potencial? No
-- Dependencias: 014 (periodos), 002 (users)

-- ============================================
-- UP: Crear tabla costos_por_persona
-- ============================================

BEGIN;

CREATE TABLE costos_por_persona (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  periodo_id       UUID NOT NULL REFERENCES periodos(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  remuneracion     NUMERIC(14,2) NOT NULL CHECK (remuneracion >= 0),
  dias_habiles     INTEGER NOT NULL CHECK (dias_habiles > 0),
  horas_por_dia    INTEGER NOT NULL DEFAULT 8 CHECK (horas_por_dia > 0),

  created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by_user_id  UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by_user_id  UUID REFERENCES users(id) ON DELETE SET NULL,

  UNIQUE (periodo_id, user_id)
);

CREATE INDEX idx_costos_por_persona_periodo_id ON costos_por_persona(periodo_id);
CREATE INDEX idx_costos_por_persona_user_id    ON costos_por_persona(user_id);

COMMIT;

-- ============================================
-- DOWN: Eliminar tabla costos_por_persona
-- ============================================

-- BEGIN;
-- DROP TABLE IF EXISTS costos_por_persona CASCADE;
-- COMMIT;
