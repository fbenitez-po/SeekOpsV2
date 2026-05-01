-- ============================================================
-- apply_catalogs_neon.sql
-- Actualiza los catálogos de proyectos en Neon con los valores
-- reales del negocio, preservando proyectos existentes.
--
-- Qué hace:
--   1. Inserta los nuevos valores en las 4 tablas
--   2. Redirige FKs de proyectos existentes hacia los nuevos valores
--   3. Limpia registros M2M que apuntaban a categorías viejas
--   4. Borra los códigos placeholder viejos
--
-- Tablas afectadas:
--   project_segmentation, project_categories,
--   productivity_layers, service_types
--
-- Uso:
--   psql "<connection_string_neon>" -f apply_catalogs_neon.sql
-- ============================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────
-- PASO 1: Insertar nuevos valores
-- ON CONFLICT DO NOTHING por si alguno ya fue insertado antes
-- ─────────────────────────────────────────────────────────────

INSERT INTO project_segmentation (codigo, nombre) VALUES
  ('I001',        'I001 - Redes Sociales'),
  ('I002',        'I002 - Diseño y Desarrollo de Producto'),
  ('I002_DIGITAL','I002 - Diseño y Desarrollo Digital de Producto'),
  ('I003',        'I003 - Branding'),
  ('I004',        'I004 - Product & Experience Design'),
  ('I005',        'I005 - SEO'),
  ('I006',        'I006 - Otros'),
  ('I007',        'I007 - Partnerships'),
  ('I008',        'I008 - Staff Augmentation')
ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre, updated_at = NOW();

INSERT INTO project_categories (codigo, nombre) VALUES
  ('DESIGN_PARTNERSHIP_SQUAD',    'Design Partnership Squad'),
  ('DEV_PARTNERSHIP_SQUAD',       'Development Partnership Squad'),
  ('INVESTIGACION_RETO',          'Investigacion de reto'),
  ('E_COMMERCE',                  'E - Commerce'),
  ('GESTION_ESTRATEGIA_MEDIOS',   'Gestion Estrategia de Medios'),
  ('STAFF_AUG_DEV',               'Staff Augmentation - Development'),
  ('PAGINA_WEB_CORPORATIVA',      'Pagina Web Corporativa'),
  ('BOLSA_HORAS_DEV',             'Bolsa de Horas - Development'),
  ('INTERNO_SEEK',                'Interno - Seek'),
  ('BOLSA_HORAS_DISENO',          'Bolsa de Horas - Diseño y experiencia'),
  ('LANDING_PAGE',                'Landing Page'),
  ('PROD_DIG_DISENO_DEV',         'Producto Digital - Diseño y Desarrollo'),
  ('PROD_DIG_E2E',                'Producto Digital - End to End'),
  ('PROD_DIG_INV_DISENO',         'Producto Digital - Investigación y Diseño'),
  ('MINISITE',                    'Minisite'),
  ('PROD_DIG_DISENO_PROD',        'Producto Digital - Diseño de Producto'),
  ('ESTRATEGIA_SEO',              'Estrategia SEO'),
  ('DISENO_SERVICIO',             'Diseño de Servicio'),
  ('PROGRAMA_FIDELIZACION',       'Programa Fidelizacion'),
  ('SERVICIOS_DESARROLLO',        'Servicios de desarrollo'),
  ('BRANDING_SERVICIOS_DISENO',   'Branding servicios diseño'),
  ('ESTRATEGIA_DIG_SOCIAL_MEDIA', 'Estrategia Digital - Social Media'),
  ('BRANDING',                    'Branding'),
  ('ESTRATEGIA_DIG_TOOLKIT',      'Estrategia Digital - Tool Kit'),
  ('EVAL_HEURISTICA_UX',          'Evaluacion Heuristica y Auditoría UX'),
  ('BRANDING_BRAND_BOOK',         'Branding - Brand Book'),
  ('BRANDING_OTROS',              'Branding - Otros Servicios'),
  ('ESTRATEGIA_DIG_OTROS',        'Estrategia Digital - Otros'),
  ('STAFF_AUG_DESIGN',            'Staff Augmentation - Design'),
  ('DISENO_ESTRATEGICO',          'Diseño estratégico'),
  ('RECLUTAMIENTO',               'Reclutamiento'),
  ('CAPACITACION',                'Capacitación'),
  ('COMERCIAL',                   'Comercial'),
  ('AREA',                        'Área')
ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre, updated_at = NOW();

INSERT INTO productivity_layers (codigo, nombre) VALUES
  ('OPERATIONAL_BACKBONE', 'Operational Backbone'),
  ('CULTURE_BUILDERS',     'Culture Builders'),
  ('GROWTH_LEAPS',         'Growth Leaps')
ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre, updated_at = NOW();

INSERT INTO service_types (codigo, nombre) VALUES
  ('PROYECTO',            'Proyecto'),
  ('SERVICIO_RECURRENTE', 'Servicio recurrente')
ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre, updated_at = NOW();

-- ─────────────────────────────────────────────────────────────
-- PASO 2: Redirigir projects.project_segmentation_id
-- (columna NOT NULL — no se puede dejar vacía)
-- Los proyectos que apuntaban a un código viejo pasan a I001.
-- ─────────────────────────────────────────────────────────────
UPDATE projects
SET project_segmentation_id = (
  SELECT id FROM project_segmentation WHERE codigo = 'I001'
)
WHERE project_segmentation_id IN (
  SELECT id FROM project_segmentation
  WHERE codigo IN ('ENTERPRISE', 'MID_MARKET', 'SMB')
);

-- ─────────────────────────────────────────────────────────────
-- PASO 3: Limpiar M2M que apuntan a categorías viejas
-- ─────────────────────────────────────────────────────────────
DELETE FROM project_project_categories
WHERE project_category_id IN (
  SELECT id FROM project_categories
  WHERE codigo IN ('CONSULTORIA', 'DESARROLLO', 'MANTENIMIENTO', 'SOPORTE')
);

-- ─────────────────────────────────────────────────────────────
-- PASO 4: Nullear FKs nullables en projects que apuntan a valores viejos
-- ─────────────────────────────────────────────────────────────
UPDATE projects
SET productivity_layer_id = NULL
WHERE productivity_layer_id IN (
  SELECT id FROM productivity_layers
  WHERE codigo IN ('ALTA', 'MEDIA', 'BAJA')
);

UPDATE projects
SET service_type_id = NULL
WHERE service_type_id IN (
  SELECT id FROM service_types
  WHERE codigo IN ('CONSULTORIA', 'DESARROLLO', 'SOPORTE')
);

-- ─────────────────────────────────────────────────────────────
-- PASO 5: Borrar códigos viejos
-- ─────────────────────────────────────────────────────────────
DELETE FROM project_segmentation
WHERE codigo IN ('ENTERPRISE', 'MID_MARKET', 'SMB');

DELETE FROM project_categories
WHERE codigo IN ('CONSULTORIA', 'DESARROLLO', 'MANTENIMIENTO', 'SOPORTE');

DELETE FROM productivity_layers
WHERE codigo IN ('ALTA', 'MEDIA', 'BAJA');

DELETE FROM service_types
WHERE codigo IN ('CONSULTORIA', 'DESARROLLO', 'SOPORTE');

COMMIT;
