-- Migration: 005_client_project_table_separation.sql
-- Descripción: Separar entidades de configuración entre clientes y proyectos
--   - Renombra segmentations → client_segmentations (uso exclusivo de clientes)
--   - Renombra sectors       → client_sectors       (uso exclusivo de clientes)
--   - Crea project_segmentation    (catálogo propio para proyectos)
--   - Crea project_categories      (catálogo multi-select para proyectos)
--   - Crea project_project_categories (M2M projects ↔ project_categories)
--   - Crea productivity_layers     (capa de productividad, tabla propia)
--   - Actualiza FKs en projects: segmentation_id → project_segmentation,
--     income_category_id eliminado (reemplazado por M2M),
--     productivity_layer_id → productivity_layers
-- Fecha: 2026-04-30
-- ¿Requiere downtime? No
-- ¿Pérdida de datos potencial? No (renombres conservan datos; DROP de income_category_id
--   pierde el valor si ya había registros — aceptable en entorno de desarrollo)
-- Dependencias: 001, 002, 003, 004 deben ejecutarse primero

-- ============================================
-- UP
-- ============================================
-- ─────────────────────────────────────────────
-- 1. Renombrar segmentations → client_segmentations
-- ─────────────────────────────────────────────
ALTER TABLE segmentations RENAME TO client_segmentations;
ALTER INDEX idx_segmentations_codigo RENAME TO idx_client_segmentations_codigo;
-- El FK en clients.segmentation_id sigue apuntando a la misma tabla (ahora client_segmentations)
-- sin necesidad de tocar la columna; sólo el nombre de tabla cambió.

-- ─────────────────────────────────────────────
-- 2. Renombrar sectors → client_sectors
-- ─────────────────────────────────────────────
ALTER TABLE sectors RENAME TO client_sectors;
ALTER INDEX idx_sectors_codigo RENAME TO idx_client_sectors_codigo;

-- ─────────────────────────────────────────────
-- 3. Crear project_segmentation (catálogo para proyectos)
-- ─────────────────────────────────────────────
CREATE TABLE project_segmentation (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo      VARCHAR(50)  NOT NULL UNIQUE,
  nombre      VARCHAR(100) NOT NULL,
  descripcion TEXT,
  activo      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_project_segmentation_codigo ON project_segmentation(codigo);

INSERT INTO project_segmentation (codigo, nombre, descripcion) VALUES
  ('ENTERPRISE', 'Enterprise',  'Proyectos de clientes grandes'),
  ('MID_MARKET', 'Mid Market',  'Proyectos de clientes medianos'),
  ('SMB',        'SMB',         'Proyectos de clientes pequeños');

-- ─────────────────────────────────────────────
-- 4. Crear project_categories (catálogo multi-select para proyectos)
-- ─────────────────────────────────────────────
CREATE TABLE project_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo      VARCHAR(50)  NOT NULL UNIQUE,
  nombre      VARCHAR(100) NOT NULL,
  descripcion TEXT,
  activo      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_project_categories_codigo ON project_categories(codigo);

INSERT INTO project_categories (codigo, nombre) VALUES
  ('CONSULTORIA',   'Consultoría'),
  ('DESARROLLO',    'Desarrollo'),
  ('MANTENIMIENTO', 'Mantenimiento'),
  ('SOPORTE',       'Soporte');

-- ─────────────────────────────────────────────
-- 5. Crear project_project_categories (M2M projects ↔ project_categories)
--    Un proyecto puede tener múltiples categorías seleccionadas
-- ─────────────────────────────────────────────
CREATE TABLE project_project_categories (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  project_category_id UUID NOT NULL REFERENCES project_categories(id),
  created_at          TIMESTAMP NOT NULL DEFAULT NOW(),

  UNIQUE(project_id, project_category_id)
);

CREATE INDEX idx_ppc_project_id  ON project_project_categories(project_id);
CREATE INDEX idx_ppc_category_id ON project_project_categories(project_category_id);

-- ─────────────────────────────────────────────
-- 6. Crear productivity_layers (capa de productividad — tabla propia)
-- ─────────────────────────────────────────────
CREATE TABLE productivity_layers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo      VARCHAR(50)  NOT NULL UNIQUE,
  nombre      VARCHAR(100) NOT NULL,
  descripcion TEXT,
  activo      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_productivity_layers_codigo ON productivity_layers(codigo);

-- Seeds iniciales — ajustar según definición de negocio
INSERT INTO productivity_layers (codigo, nombre) VALUES
  ('ALTA',  'Alta'),
  ('MEDIA', 'Media'),
  ('BAJA',  'Baja');

-- ─────────────────────────────────────────────
-- 7. Actualizar tabla projects
-- ─────────────────────────────────────────────

-- 7a. segmentation_id: desconectar del catálogo de clientes, conectar a project_segmentation
--     El constraint FK auto-generado por PostgreSQL se llama projects_segmentation_id_fkey
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_segmentation_id_fkey;
ALTER TABLE projects ADD CONSTRAINT projects_project_segmentation_fkey
  FOREIGN KEY (segmentation_id) REFERENCES project_segmentation(id);

-- 7b. Renombrar la columna para reflejar la nueva referencia
ALTER TABLE projects RENAME COLUMN segmentation_id TO project_segmentation_id;
CREATE INDEX idx_projects_project_segmentation_id ON projects(project_segmentation_id);

-- 7c. Eliminar income_category_id (reemplazado por M2M project_project_categories)
DROP INDEX IF EXISTS idx_projects_income_category_id;
ALTER TABLE projects DROP COLUMN IF EXISTS income_category_id;

-- 7d. productivity_layer_id: cambiar referencia de income_categories → productivity_layers
--     El constraint FK auto-generado se llama projects_productivity_layer_id_fkey
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_productivity_layer_id_fkey;
ALTER TABLE projects ADD CONSTRAINT projects_productivity_layer_id_fkey
  FOREIGN KEY (productivity_layer_id) REFERENCES productivity_layers(id);
-- ============================================
-- DOWN
-- ============================================

-- BEGIN;
-- -- 7d. Revertir productivity_layer_id → income_categories
-- ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_productivity_layer_id_fkey;
-- ALTER TABLE projects ADD CONSTRAINT projects_productivity_layer_id_fkey
--   FOREIGN KEY (productivity_layer_id) REFERENCES income_categories(id);
--
-- -- 7c. Restaurar income_category_id (sin datos previos)
-- ALTER TABLE projects ADD COLUMN income_category_id UUID REFERENCES income_categories(id);
-- CREATE INDEX idx_projects_income_category_id ON projects(income_category_id);
--
-- -- 7b. Revertir nombre de columna
-- ALTER TABLE projects RENAME COLUMN project_segmentation_id TO segmentation_id;
-- DROP INDEX IF EXISTS idx_projects_project_segmentation_id;
--
-- -- 7a. Revertir FK a segmentations (que vuelve a ser el nombre luego de los renombres)
-- ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_project_segmentation_fkey;
-- ALTER TABLE projects ADD CONSTRAINT projects_segmentation_id_fkey
--   FOREIGN KEY (segmentation_id) REFERENCES segmentations(id);
--
-- -- 6. Eliminar productivity_layers
-- DROP TABLE IF EXISTS productivity_layers CASCADE;
--
-- -- 5. Eliminar project_project_categories
-- DROP TABLE IF EXISTS project_project_categories CASCADE;
--
-- -- 4. Eliminar project_categories
-- DROP TABLE IF EXISTS project_categories CASCADE;
--
-- -- 3. Eliminar project_segmentation
-- DROP TABLE IF EXISTS project_segmentation CASCADE;
--
-- -- 2. Revertir client_sectors → sectors
-- ALTER TABLE client_sectors RENAME TO sectors;
-- ALTER INDEX idx_client_sectors_codigo RENAME TO idx_sectors_codigo;
--
-- -- 1. Revertir client_segmentations → segmentations
-- ALTER TABLE client_segmentations RENAME TO segmentations;
-- ALTER INDEX idx_client_segmentations_codigo RENAME TO idx_segmentations_codigo;
--
-- COMMIT;
