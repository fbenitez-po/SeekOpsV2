-- ============================================================
-- SEEKOPS — Data (initial system data and catalogs)
-- Run this AFTER schema.sql.
-- Note: column/table names are in English; data values are kept
-- in their original language (business content).
-- ============================================================

BEGIN;

-- income_categories -----------------------------------------

INSERT INTO income_categories (code, name, description) VALUES
  ('RECLUTAMIENTO', 'Reclutamiento', ''),
  ('CAPACITACION',  'Capacitación',  ''),
  ('COMERCIAL',     'Comercial',     ''),
  ('AREA',          'Área',          ''),
  ('CULTURA',       'Cultura',       '');

-- work_categories -------------------------------------------

INSERT INTO work_categories (code, name) VALUES
  ('ESTRATEGIA',             'Estrategia'),
  ('GESTORES_GESTION',       'Gestores - Gestión y planeamiento'),
  ('UX_RESEARCH',            'User Experience - Research'),
  ('UI',                     'User Interface'),
  ('DEV_FRONTEND',           'Development - Front End'),
  ('SEO',                    'SEO'),
  ('DEV_BACKEND',            'Development - Back - End'),
  ('DEV_QA',                 'Development - QA'),
  ('UX_PROTOTYPE',           'User Experience - Prototype'),
  ('DISENIO_SOCIAL_MEDIA',   'Diseño Social Media'),
  ('APOYO',                  'Apoyo'),
  ('UI_PROTOTYPE',           'User Interface - Prototype'),
  ('UX_TESTING',             'User Experience - Testing'),
  ('LIDERES_GESTION',        'Líderes - Gestión'),
  ('PRODUCT_MANAGEMENT',     'Product Management'),
  ('CAPACITACIONES',         'Capacitaciones'),
  ('PROPUESTAS_COMERCIALES', 'Propuestas Comerciales'),
  ('RECLUTAMIENTO',          'Reclutamiento');

-- service_types ---------------------------------------------

INSERT INTO service_types (code, name) VALUES
  ('PROYECTO',            'Proyecto'),
  ('SERVICIO_RECURRENTE', 'Servicio recurrente');

-- client_segmentations --------------------------------------

INSERT INTO client_segmentations (code, name) VALUES
  ('CUENTA_CLAVE',         'Cuenta Clave'),
  ('CUENTA_INTERNACIONAL', 'Cuenta Internacional'),
  ('CUENTA_DESARROLLO',    'Cuenta Desarrollo'),
  ('CUENTA_CASUAL',        'Cuenta Casual'),
  ('CUENTA_INACTIVA',      'Cuenta Inactiva'),
  ('CUENTA_EXCLUIDA',      'Cuenta Excluida'),
  ('NUEVOS_CLIENTES',      'Nuevos Clientes');

-- client_sectors --------------------------------------------

INSERT INTO client_sectors (code, name) VALUES
  ('CONSULTORIA',          'Consultoría'),
  ('BANCA_FINANCIERO',     'Banca y Servicios Financieros'),
  ('TECNOLOGIA',           'Tecnología'),
  ('TRANSPORTE',           'Transporte'),
  ('ALIMENTACION',         'Alimentación'),
  ('CUIDADO_PERSONAL',     'Cuidado Personal'),
  ('INST_EDUCATIVAS',      'Instituciones Educativas'),
  ('RETAIL',               'Retail'),
  ('CONSTRUCCION',         'Construcción'),
  ('SALUD_FARMA',          'Salud y Farma'),
  ('VARIOS',               'Varios'),
  ('PESCA',                'Pesca'),
  ('GOBIERNO',             'Gobierno'),
  ('INMOBILIARIO',         'Inmobiliario'),
  ('ACELERADORA',          'Aceleradora'),
  ('MARKETING',            'Marketing'),
  ('PUBLICIDAD',           'Publicidad'),
  ('LOGISTICA_SUMINISTRO', 'Logistica y Suministro'),
  ('SEGUROS',              'Seguros'),
  ('TELECOMUNICACIONES',   'Telecomunicaciones'),
  ('CONSUMO_MASIVO',       'Consumo Masivo'),
  ('HIDROCARBUROS',        'Hidrocarburos'),
  ('SERVICIOS',            'Servicios'),
  ('HOTELERIA_TURISMO',    'Hoteleria y Turismo'),
  ('INDUSTRIAL',           'Industrial'),
  ('ENERGIA',              'Energía'),
  ('CEMENTOS',             'Cementos'),
  ('EDUCACION',            'Educación'),
  ('MINERIA',              'Minería'),
  ('INST_DEPORTIVAS',      'Instituciones Deportivas'),
  ('AUTOMOTRIZ',           'Automotriz'),
  ('ONG',                  'ONG'),
  ('BELLEZA',              'Belleza');

-- teams -----------------------------------------------------

INSERT INTO teams (code, name) VALUES
  ('UI',                  'U.Interface'),
  ('UX',                  'U.Experience'),
  ('BRANDING',            'Branding'),
  ('CLIENTE',             'Cliente'),
  ('DIRECTOR',            'Director'),
  ('SEO',                 'SEO'),
  ('OUTSOURCING',         'Outsourcing'),
  ('ADMINISTRATIVO',      'Administrativo'),
  ('SOCIAL_MEDIA',        'Social Media'),
  ('ESTRATEGIA',          'Estrategia'),
  ('PRODUCTO',            'Producto'),
  ('DISENIO_EXPERIENCIA', 'Diseño de Experiencia'),
  ('TECNOLOGIA',          'Tecnología');

-- areas -----------------------------------------------------

INSERT INTO areas (code, name) VALUES
  ('TALENTO_CULTURA',     'Talento & Cultura'),
  ('COMERCIAL',           'Comercial'),
  ('PRODUCTO',            'Producto'),
  ('TECNOLOGIA',          'Tecnología'),
  ('ESTRATEGIA',          'Estrategia'),
  ('ADMINISTRACION',      'Administración'),
  ('DISENIO_EXPERIENCIA', 'Diseño de Experiencia'),
  ('OUTSOURCING',         'Outsourcing');

-- project_segmentation --------------------------------------

INSERT INTO project_segmentation (code, name) VALUES
  ('I001',         'I001 - Redes Sociales'),
  ('I002',         'I002 - Diseño y Desarrollo de Producto'),
  ('I002_DIGITAL', 'I002 - Diseño y Desarrollo Digital de Producto'),
  ('I003',         'I003 - Branding'),
  ('I004',         'I004 - Product & Experience Design'),
  ('I005',         'I005 - SEO'),
  ('I006',         'I006 - Otros'),
  ('I007',         'I007 - Partnerships'),
  ('I008',         'I008 - Staff Augmentation');

-- project_categories ----------------------------------------

INSERT INTO project_categories (code, name) VALUES
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
  ('AREA',                        'Área');

-- productivity_layers ---------------------------------------

INSERT INTO productivity_layers (code, name) VALUES
  ('OPERATIONAL_BACKBONE', 'Operational Backbone'),
  ('CULTURE_BUILDERS',     'Culture Builders'),
  ('GROWTH_LEAPS',         'Growth Leaps');

-- profiles --------------------------------------------------

INSERT INTO profiles (code, name, description) VALUES
  ('ADMIN',  'Administradores', 'Acceso total al sistema'),
  ('SEEKER', 'Seekers',         'Registro de horas trabajadas'),
  ('GESTOR', 'Gestores',        'Aprobación de horas del equipo');

-- Initial admin user ----------------------------------------
-- Password: Admin123! (bcrypt 10 rounds). Change in production.

DO $$
DECLARE
  v_team_id UUID;
BEGIN
  SELECT id INTO v_team_id FROM teams LIMIT 1;

  INSERT INTO users (
    email, password_hash, first_name, last_name,
    document_number, position, team_id, hire_date,
    is_active, is_staff, is_superuser
  ) VALUES (
    'admin@seekglobal.co',
    '$2a$10$k7CkE/Pwe48IjA.zsQdfAOUJRImHuxUsqXjx318MM9y79wVxxxJeC',
    'Admin', 'Seekops', '00000001', 'Administrador del Sistema',
    v_team_id, '2024-01-01', true, true, true
  );
END $$;

INSERT INTO user_profile (user_id, profile_id)
SELECT u.id, p.id
FROM users u, profiles p
WHERE u.email = 'admin@seekglobal.co' AND p.code = 'ADMIN';

-- periods ---------------------------------------------------
-- Jan 2026 → May 2028; Jan-Mar 2026 closed

INSERT INTO periods (month, year, is_closed)
SELECT
  EXTRACT(MONTH FROM d)::INTEGER,
  EXTRACT(YEAR  FROM d)::INTEGER,
  CASE
    WHEN EXTRACT(YEAR FROM d) = 2026 AND EXTRACT(MONTH FROM d) <= 3 THEN true
    ELSE false
  END
FROM generate_series(
  '2026-01-01'::date,
  '2028-05-01'::date,
  '1 month'::interval
) AS d;

-- document_types --------------------------------------------

INSERT INTO document_types (name) VALUES
  ('Orden de Compra'),
  ('Contrato'),
  ('Propuesta'),
  ('Addendum'),
  ('Carta de Intención'),
  ('Factura Proforma'),
  ('Otro');

COMMIT;
