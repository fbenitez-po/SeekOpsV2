-- Migration: 014_periodos.sql
-- Descripción: Tabla de periodos mensuales con estado abierto/cerrado
-- Fecha: 2026-05-11
-- ¿Requiere downtime? No
-- ¿Pérdida de datos potencial? No
-- Dependencias: ninguna

-- ============================================
-- UP: Crear tabla periodos + seed inicial
-- ============================================

BEGIN;

CREATE TABLE periodos (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mes          INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
  anio         INTEGER NOT NULL CHECK (anio >= 2020),
  esta_cerrado BOOLEAN NOT NULL DEFAULT false,

  created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_periodos_mes_anio UNIQUE (mes, anio)
);

CREATE INDEX idx_periodos_anio ON periodos(anio);
CREATE INDEX idx_periodos_anio_mes ON periodos(anio, mes);

-- Seed: Jan 2026 → May 2028 (2 años adelante desde el mes actual)
-- Jan, Feb, Mar 2026 → cerrados
-- Apr 2026 en adelante → abiertos
INSERT INTO periodos (mes, anio, esta_cerrado)
SELECT
  EXTRACT(MONTH FROM d)::INTEGER,
  EXTRACT(YEAR FROM d)::INTEGER,
  CASE
    WHEN EXTRACT(YEAR FROM d) = 2026 AND EXTRACT(MONTH FROM d) <= 3 THEN true
    ELSE false
  END
FROM generate_series(
  '2026-01-01'::date,
  '2028-05-01'::date,
  '1 month'::interval
) AS d;

COMMIT;

-- ============================================
-- DOWN: Eliminar tabla periodos
-- ============================================

-- BEGIN;
-- DROP TABLE IF EXISTS periodos CASCADE;
-- COMMIT;
