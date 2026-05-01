-- Migration: 001_initial_config_tables.sql
-- Descripción: Crear tablas de configuración del sistema
-- Fecha: 2026-04-23
-- ¿Requiere downtime? No
-- ¿Pérdida de datos potencial? No

-- ============================================
-- UP: Crear tablas de configuración
-- ============================================

BEGIN;

-- Tabla: income_categories (categorías de ingreso para proyectos y líneas)
-- Columna: name (no nombre) — coincide con lo que usa el data layer
CREATE TABLE income_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  descripcion TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_income_categories_codigo ON income_categories(codigo);

-- Tabla: client_categories (categorías de cliente/usuario — usadas en clientes)
-- Separada de income_categories para permitir evolución independiente
CREATE TABLE client_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  descripcion TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_client_categories_codigo ON client_categories(codigo);

-- Tabla: service_types (tipos de servicio)
CREATE TABLE service_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) NOT NULL UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_service_types_codigo ON service_types(codigo);

-- Tabla: segmentations (segmentación de clientes/proyectos)
CREATE TABLE segmentations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) NOT NULL UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_segmentations_codigo ON segmentations(codigo);

-- Tabla: sectors (sector de industria del cliente)
CREATE TABLE sectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) NOT NULL UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sectors_codigo ON sectors(codigo);

-- Tabla: teams (equipos internos, usados para clasificar usuarios)
-- Columna: name (no nombre) — coincide con lo que usa el data layer y config routes
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  descripcion TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_teams_codigo ON teams(codigo);

-- Tabla: areas (áreas funcionales de la empresa)
-- Columna: name (no nombre) — coincide con lo que usa el data layer y config routes
CREATE TABLE areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  descripcion TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_areas_codigo ON areas(codigo);

-- ============================================
-- SEEDS: Data inicial de configuración
-- ============================================

-- Categorías de ingreso
INSERT INTO income_categories (codigo, name, descripcion) VALUES
('CONSULTORIA', 'Consultoría', ''),
('DESARROLLO', 'Desarrollo', ''),
('MANTENIMIENTO', 'Mantenimiento', ''),
('SOPORTE', 'Soporte', '');

-- Categorías de cliente
INSERT INTO client_categories (codigo, name) VALUES
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

-- Tipos de servicio
INSERT INTO service_types (codigo, nombre, descripcion) VALUES
('CONSULTORIA', 'Consultoría', ''),
('DESARROLLO', 'Desarrollo', ''),
('SOPORTE', 'Soporte Técnico', '');

-- Segmentaciones de cliente
INSERT INTO segmentations (codigo, nombre) VALUES
('CUENTA_CLAVE',          'Cuenta Clave'),
('CUENTA_INTERNACIONAL',  'Cuenta Internacional'),
('CUENTA_DESARROLLO',     'Cuenta Desarrollo'),
('CUENTA_CASUAL',         'Cuenta Casual'),
('CUENTA_INACTIVA',       'Cuenta Inactiva'),
('CUENTA_EXCLUIDA',       'Cuenta Excluida'),
('NUEVOS_CLIENTES',       'Nuevos Clientes');

-- Sectores de cliente
INSERT INTO sectors (codigo, nombre) VALUES
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

-- Equipos de trabajo
INSERT INTO teams (codigo, name) VALUES
('UI',                 'U.Interface'),
('UX',                 'U.Experience'),
('BRANDING',           'Branding'),
('CLIENTE',            'Cliente'),
('DIRECTOR',           'Director'),
('SEO',                'SEO'),
('OUTSOURCING',        'Outsourcing'),
('ADMINISTRATIVO',     'Administrativo'),
('SOCIAL_MEDIA',       'Social Media'),
('ESTRATEGIA',         'Estrategia'),
('PRODUCTO',           'Producto'),
('DISENIO_EXPERIENCIA','Diseño de Experiencia'),
('TECNOLOGIA',         'Tecnología');

-- Áreas funcionales
INSERT INTO areas (codigo, name) VALUES
('TALENTO_CULTURA',    'Talento & Cultura'),
('COMERCIAL',          'Comercial'),
('PRODUCTO',           'Producto'),
('TECNOLOGIA',         'Tecnología'),
('ESTRATEGIA',         'Estrategia'),
('ADMINISTRACION',     'Administración'),
('DISENIO_EXPERIENCIA','Diseño de Experiencia'),
('OUTSOURCING',        'Outsourcing');

COMMIT;

-- ============================================
-- DOWN: Eliminar tablas de configuración
-- ============================================

-- BEGIN;
-- DROP TABLE IF EXISTS areas CASCADE;
-- DROP TABLE IF EXISTS teams CASCADE;
-- DROP TABLE IF EXISTS sectors CASCADE;
-- DROP TABLE IF EXISTS segmentations CASCADE;
-- DROP TABLE IF EXISTS service_types CASCADE;
-- DROP TABLE IF EXISTS client_categories CASCADE;
-- DROP TABLE IF EXISTS income_categories CASCADE;
-- COMMIT;
