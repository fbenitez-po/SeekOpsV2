-- Migración 010: Agregar categoria_id a hour_projections
-- Sin downtime, columna nullable con FK a client_categories

-- UP
ALTER TABLE hour_projections
  ADD COLUMN categoria_id UUID REFERENCES client_categories(id) ON DELETE SET NULL;

CREATE INDEX idx_hour_projections_categoria_id ON hour_projections(categoria_id);

-- DOWN
-- DROP INDEX IF EXISTS idx_hour_projections_categoria_id;
-- ALTER TABLE hour_projections DROP COLUMN IF EXISTS categoria_id;
