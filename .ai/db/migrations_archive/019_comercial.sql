-- Migration: 019_comercial.sql
-- Descripción: Módulo Comercial — catálogo de tipos de documento y registros comerciales
-- Fecha: 2026-05-11
-- ¿Requiere downtime? No
-- ¿Pérdida de datos potencial? No
-- Dependencias: 002_core_tables.sql (projects, users)

-- ============================================
-- UP
-- ============================================

BEGIN;

-- Catálogo de tipos de documento
CREATE TABLE tipos_documento (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre     VARCHAR(100) NOT NULL UNIQUE,
  activo     BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO tipos_documento (nombre) VALUES
  ('Orden de Compra'),
  ('Contrato'),
  ('Propuesta'),
  ('Addendum'),
  ('Carta de Intención'),
  ('Factura Proforma'),
  ('Otro');

-- Registros comerciales
CREATE TABLE registros_comerciales (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha_registro    DATE NOT NULL,
  proyecto_id       UUID NOT NULL REFERENCES projects(id),
  responsable_id    UUID NOT NULL REFERENCES users(id),
  detalle           TEXT,
  precio            NUMERIC(12, 2) NOT NULL CHECK (precio >= 0),
  moneda            VARCHAR(3) NOT NULL DEFAULT 'PEN',
  tipo_documento_id UUID REFERENCES tipos_documento(id),
  estado_contrato   BOOLEAN NOT NULL DEFAULT false,
  facturacion       BOOLEAN NOT NULL DEFAULT false,
  evidencia_nombre  VARCHAR(500),

  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by  UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_registros_comerciales_proyecto_id    ON registros_comerciales(proyecto_id);
CREATE INDEX idx_registros_comerciales_responsable_id ON registros_comerciales(responsable_id);
CREATE INDEX idx_registros_comerciales_fecha_registro ON registros_comerciales(fecha_registro DESC);

COMMIT;

-- ============================================
-- DOWN
-- ============================================

-- BEGIN;
-- DROP TABLE IF EXISTS registros_comerciales CASCADE;
-- DROP TABLE IF EXISTS tipos_documento CASCADE;
-- COMMIT;
