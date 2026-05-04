-- Migration: 007_update_project_catalog_seeds.sql
-- Descripción: Reemplazar seeds placeholder de catálogos de proyectos con
--   datos reales del negocio para las 4 tablas:
--     - project_segmentation  (segmentación de proyectos)
--     - project_categories    (categoría de ingreso, multi-select)
--     - productivity_layers   (capa de productividad)
--     - service_types         (tipo de servicio)
-- Fecha: 2026-05-01
-- ¿Requiere downtime? No
-- ¿Pérdida de datos potencial? Sí — elimina seeds placeholder de migraciones 001 y 005
-- Dependencias: 001–006 deben ejecutarse primero

-- ============================================
-- UP
-- ============================================
-- ─────────────────────────────────────────────
-- 1. project_segmentation
--    El nombre incluye el prefijo de negocio (ej. "I002 - Diseño y Desarrollo de Producto").
--    El codigo es la clave técnica interna.
-- ─────────────────────────────────────────────
DELETE FROM project_segmentation;

INSERT INTO project_segmentation (codigo, nombre) VALUES
  ('I001', 'I001 - Redes Sociales'),
  ('I002', 'I002 - Diseño y Desarrollo de Producto'),
  ('I002_DIGITAL', 'I002 - Diseño y Desarrollo Digital de Producto'),
  ('I003', 'I003 - Branding'),
  ('I004', 'I004 - Product & Experience Design'),
  ('I005', 'I005 - SEO'),
  ('I006', 'I006 - Otros'),
  ('I007', 'I007 - Partnerships'),
  ('I008', 'I008 - Staff Augmentation');

-- ─────────────────────────────────────────────
-- 2. project_categories (Categoría de ingreso)
-- ─────────────────────────────────────────────
DELETE FROM project_categories;

INSERT INTO project_categories (codigo, nombre) VALUES
  ('DESIGN_PARTNERSHIP_SQUAD',     'Design Partnership Squad'),
  ('DEV_PARTNERSHIP_SQUAD',        'Development Partnership Squad'),
  ('INVESTIGACION_RETO',           'Investigacion de reto'),
  ('E_COMMERCE',                   'E - Commerce'),
  ('GESTION_ESTRATEGIA_MEDIOS',    'Gestion Estrategia de Medios'),
  ('STAFF_AUG_DEV',                'Staff Augmentation - Development'),
  ('PAGINA_WEB_CORPORATIVA',       'Pagina Web Corporativa'),
  ('BOLSA_HORAS_DEV',              'Bolsa de Horas - Development'),
  ('INTERNO_SEEK',                 'Interno - Seek'),
  ('BOLSA_HORAS_DISENO',           'Bolsa de Horas - Diseño y experiencia'),
  ('LANDING_PAGE',                 'Landing Page'),
  ('PROD_DIG_DISENO_DEV',          'Producto Digital - Diseño y Desarrollo'),
  ('PROD_DIG_E2E',                 'Producto Digital - End to End'),
  ('PROD_DIG_INV_DISENO',          'Producto Digital - Investigación y Diseño'),
  ('MINISITE',                     'Minisite'),
  ('PROD_DIG_DISENO_PROD',         'Producto Digital - Diseño de Producto'),
  ('ESTRATEGIA_SEO',               'Estrategia SEO'),
  ('DISENO_SERVICIO',              'Diseño de Servicio'),
  ('PROGRAMA_FIDELIZACION',        'Programa Fidelizacion'),
  ('SERVICIOS_DESARROLLO',         'Servicios de desarrollo'),
  ('BRANDING_SERVICIOS_DISENO',    'Branding servicios diseño'),
  ('ESTRATEGIA_DIG_SOCIAL_MEDIA',  'Estrategia Digital - Social Media'),
  ('BRANDING',                     'Branding'),
  ('ESTRATEGIA_DIG_TOOLKIT',       'Estrategia Digital - Tool Kit'),
  ('EVAL_HEURISTICA_UX',           'Evaluacion Heuristica y Auditoría UX'),
  ('BRANDING_BRAND_BOOK',          'Branding - Brand Book'),
  ('BRANDING_OTROS',               'Branding - Otros Servicios'),
  ('ESTRATEGIA_DIG_OTROS',         'Estrategia Digital - Otros'),
  ('STAFF_AUG_DESIGN',             'Staff Augmentation - Design'),
  ('DISENO_ESTRATEGICO',           'Diseño estratégico'),
  ('RECLUTAMIENTO',                'Reclutamiento'),
  ('CAPACITACION',                 'Capacitación'),
  ('COMERCIAL',                    'Comercial'),
  ('AREA',                         'Área');

-- ─────────────────────────────────────────────
-- 3. productivity_layers (Capa de productividad)
-- ─────────────────────────────────────────────
DELETE FROM productivity_layers;

INSERT INTO productivity_layers (codigo, nombre) VALUES
  ('OPERATIONAL_BACKBONE', 'Operational Backbone'),
  ('CULTURE_BUILDERS',     'Culture Builders'),
  ('GROWTH_LEAPS',         'Growth Leaps');

-- ─────────────────────────────────────────────
-- 4. service_types (Tipo de servicio)
-- ─────────────────────────────────────────────
DELETE FROM service_types;

INSERT INTO service_types (codigo, nombre) VALUES
  ('PROYECTO',            'Proyecto'),
  ('SERVICIO_RECURRENTE', 'Servicio recurrente');
-- ============================================
-- DOWN
-- ============================================

-- BEGIN;
-- DELETE FROM service_types;
-- INSERT INTO service_types (codigo, nombre, descripcion) VALUES
--   ('CONSULTORIA', 'Consultoría', ''),
--   ('DESARROLLO',  'Desarrollo',  ''),
--   ('SOPORTE',     'Soporte Técnico', '');
--
-- DELETE FROM productivity_layers;
-- INSERT INTO productivity_layers (codigo, nombre) VALUES
--   ('ALTA',  'Alta'),
--   ('MEDIA', 'Media'),
--   ('BAJA',  'Baja');
--
-- DELETE FROM project_categories;
-- INSERT INTO project_categories (codigo, nombre) VALUES
--   ('CONSULTORIA',   'Consultoría'),
--   ('DESARROLLO',    'Desarrollo'),
--   ('MANTENIMIENTO', 'Mantenimiento'),
--   ('SOPORTE',       'Soporte');
--
-- DELETE FROM project_segmentation;
-- INSERT INTO project_segmentation (codigo, nombre, descripcion) VALUES
--   ('ENTERPRISE', 'Enterprise',  'Proyectos de clientes grandes'),
--   ('MID_MARKET', 'Mid Market',  'Proyectos de clientes medianos'),
--   ('SMB',        'SMB',         'Proyectos de clientes pequeños');
-- COMMIT;
