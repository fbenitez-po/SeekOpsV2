-- 009_fractional_hours.sql
-- Permite cargar horas con media hora de granularidad (ej: 2.5, 7.5)

-- UP
ALTER TABLE time_entry_lines
  ALTER COLUMN hours TYPE NUMERIC(6,1),
  ALTER COLUMN extra_hours TYPE NUMERIC(4,1);

ALTER TABLE hour_projections
  ALTER COLUMN horas_proyectadas TYPE NUMERIC(8,1);

-- Actualizar constraints de extra_hours para aceptar decimales múltiplos de 0.5
ALTER TABLE time_entry_lines
  DROP CONSTRAINT IF EXISTS check_extra_hours_range;

ALTER TABLE time_entry_lines
  ADD CONSTRAINT check_extra_hours_range
    CHECK (extra_hours >= 0 AND extra_hours <= 8 AND MOD(extra_hours, 0.5) = 0);

ALTER TABLE time_entry_lines
  DROP CONSTRAINT IF EXISTS check_hours_range;

ALTER TABLE time_entry_lines
  ADD CONSTRAINT check_hours_range
    CHECK (hours >= 0 AND MOD(hours, 0.5) = 0);

ALTER TABLE hour_projections
  DROP CONSTRAINT IF EXISTS check_horas_proyectadas;

ALTER TABLE hour_projections
  ADD CONSTRAINT check_horas_proyectadas
    CHECK (horas_proyectadas > 0 AND MOD(horas_proyectadas, 0.5) = 0);

-- DOWN
-- ALTER TABLE time_entry_lines ALTER COLUMN hours TYPE INTEGER USING hours::INTEGER;
-- ALTER TABLE time_entry_lines ALTER COLUMN extra_hours TYPE INTEGER USING extra_hours::INTEGER;
-- ALTER TABLE hour_projections ALTER COLUMN horas_proyectadas TYPE INTEGER USING horas_proyectadas::INTEGER;
