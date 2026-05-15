-- ============================================================
-- RESET + MIGRACIÓN COMPLETA — SeekOps
-- Ejecutar contra Neon (o cualquier PostgreSQL limpio)
--
-- ADVERTENCIA: Este script BORRA todo el esquema y lo recrea.
-- No ejecutar en producción con datos reales.
--
-- Uso:
--   psql "<connection_string_neon>" -f reset_and_migrate.sql
-- ============================================================

-- ─────────────────────────────────────────────
-- RESET: Limpiar esquema completo
-- ─────────────────────────────────────────────
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO PUBLIC;

-- ─────────────────────────────────────────────
-- MIGRATION 001: Tablas de configuración + seeds
-- ─────────────────────────────────────────────

BEGIN;

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

CREATE TABLE client_segmentations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) NOT NULL UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_client_segmentations_codigo ON client_segmentations(codigo);

CREATE TABLE client_sectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) NOT NULL UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_client_sectors_codigo ON client_sectors(codigo);

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

-- Seeds: income_categories
INSERT INTO income_categories (codigo, name, descripcion) VALUES
('CONSULTORIA', 'Consultoría', ''),
('DESARROLLO', 'Desarrollo', ''),
('MANTENIMIENTO', 'Mantenimiento', ''),
('SOPORTE', 'Soporte', '');

-- Seeds: client_categories
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

-- Seeds: service_types
INSERT INTO service_types (codigo, nombre, descripcion) VALUES
('CONSULTORIA', 'Consultoría', ''),
('DESARROLLO', 'Desarrollo', ''),
('SOPORTE', 'Soporte Técnico', '');

-- Seeds: client_segmentations
INSERT INTO client_segmentations (codigo, nombre) VALUES
('CUENTA_CLAVE',          'Cuenta Clave'),
('CUENTA_INTERNACIONAL',  'Cuenta Internacional'),
('CUENTA_DESARROLLO',     'Cuenta Desarrollo'),
('CUENTA_CASUAL',         'Cuenta Casual'),
('CUENTA_INACTIVA',       'Cuenta Inactiva'),
('CUENTA_EXCLUIDA',       'Cuenta Excluida'),
('NUEVOS_CLIENTES',       'Nuevos Clientes');

-- Seeds: client_sectors
INSERT INTO client_sectors (codigo, nombre) VALUES
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

-- Seeds: teams
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

-- Seeds: areas
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

-- ─────────────────────────────────────────────
-- MIGRATION 002: Tablas core + admin seed
-- ─────────────────────────────────────────────

BEGIN;

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL DEFAULT '$placeholder$',
  numero_documento VARCHAR(20) NOT NULL UNIQUE,
  nombres VARCHAR(100) NOT NULL,
  apellidos VARCHAR(100) NOT NULL,
  puesto VARCHAR(100) NOT NULL,
  celular VARCHAR(20),
  avatar_url VARCHAR(500),
  team_id UUID NOT NULL REFERENCES teams(id),
  area_id UUID NOT NULL REFERENCES areas(id),
  fecha_ingreso DATE NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT true,
  staff BOOLEAN NOT NULL DEFAULT false,
  super_usuario BOOLEAN NOT NULL DEFAULT false,
  deactivated_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_numero_documento ON users(numero_documento);
CREATE INDEX idx_users_activo ON users(activo);
CREATE INDEX idx_users_team_id ON users(team_id);
CREATE INDEX idx_users_area_id ON users(area_id);

CREATE TABLE user_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) NOT NULL UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_user_groups_codigo ON user_groups(codigo);

INSERT INTO user_groups (codigo, nombre, descripcion) VALUES
('ADMIN', 'Administradores', 'Acceso total al sistema'),
('SEEKER', 'Seekers', 'Registro de horas trabajadas'),
('GESTOR', 'Gestores', 'Aprobación de horas del equipo');

CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(100) NOT NULL,
  razon_social VARCHAR(150),
  razon_comercial VARCHAR(150),
  ruc VARCHAR(14) NOT NULL UNIQUE,
  nombre_contacto VARCHAR(100),
  email_contacto VARCHAR(255),
  telefono VARCHAR(20),
  direccion VARCHAR(200),
  client_category_id UUID NOT NULL REFERENCES client_categories(id),
  segmentation_id UUID NOT NULL REFERENCES client_segmentations(id),
  sector_id UUID REFERENCES client_sectors(id),
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_clients_ruc ON clients(ruc);
CREATE INDEX idx_clients_activo ON clients(activo);
CREATE INDEX idx_clients_segmentation_id ON clients(segmentation_id);
CREATE INDEX idx_clients_sector_id ON clients(sector_id);

-- Tablas adicionales de config de proyectos (migración 005 integrada desde el inicio)
CREATE TABLE project_segmentation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) NOT NULL UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_project_segmentation_codigo ON project_segmentation(codigo);

INSERT INTO project_segmentation (codigo, nombre, descripcion) VALUES
  ('ENTERPRISE', 'Enterprise',  'Proyectos de clientes grandes'),
  ('MID_MARKET', 'Mid Market',  'Proyectos de clientes medianos'),
  ('SMB',        'SMB',         'Proyectos de clientes pequeños');

CREATE TABLE project_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) NOT NULL UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_project_categories_codigo ON project_categories(codigo);

INSERT INTO project_categories (codigo, nombre) VALUES
  ('CONSULTORIA',   'Consultoría'),
  ('DESARROLLO',    'Desarrollo'),
  ('MANTENIMIENTO', 'Mantenimiento'),
  ('SOPORTE',       'Soporte');

CREATE TABLE productivity_layers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) NOT NULL UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_productivity_layers_codigo ON productivity_layers(codigo);

INSERT INTO productivity_layers (codigo, nombre) VALUES
  ('ALTA',  'Alta'),
  ('MEDIA', 'Media'),
  ('BAJA',  'Baja');

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) NOT NULL UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  client_id UUID NOT NULL REFERENCES clients(id),
  project_segmentation_id UUID NOT NULL REFERENCES project_segmentation(id),
  productivity_layer_id UUID REFERENCES productivity_layers(id),
  service_type_id UUID REFERENCES service_types(id),
  area_id UUID REFERENCES areas(id),
  gestor_id UUID NOT NULL REFERENCES users(id),
  fecha_inicio DATE,
  fecha_fin DATE,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT check_fecha_fin_mayor_inicio
    CHECK (fecha_fin IS NULL OR fecha_inicio IS NULL OR fecha_fin >= fecha_inicio)
);

CREATE INDEX idx_projects_code ON projects(code);
CREATE INDEX idx_projects_client_id ON projects(client_id);
CREATE INDEX idx_projects_gestor_id ON projects(gestor_id);
CREATE INDEX idx_projects_activo ON projects(activo);
CREATE INDEX idx_projects_project_segmentation_id ON projects(project_segmentation_id);
CREATE INDEX idx_projects_area_id ON projects(area_id);

-- Seed: usuario administrador
-- Contraseña: Admin123! (bcrypt 10 rounds)
DO $$
DECLARE
  v_team_id UUID;
  v_area_id UUID;
  v_user_id UUID;
BEGIN
  SELECT id INTO v_team_id FROM teams LIMIT 1;
  SELECT id INTO v_area_id FROM areas LIMIT 1;

  INSERT INTO users (email, password_hash, nombres, apellidos, numero_documento, puesto,
                     team_id, area_id, fecha_ingreso, activo, staff, super_usuario)
  VALUES (
    'admin@seekglobal.co',
    '$2a$10$k7CkE/Pwe48IjA.zsQdfAOUJRImHuxUsqXjx318MM9y79wVxxxJeC',
    'Admin', 'Seekops', '00000001', 'Administrador del Sistema',
    v_team_id, v_area_id, '2024-01-01', true, true, true
  )
  RETURNING id INTO v_user_id;
END $$;

COMMIT;

-- ─────────────────────────────────────────────
-- MIGRATION 003: Relaciones M2M + time_entries
-- ─────────────────────────────────────────────

BEGIN;

CREATE TABLE user_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  area_id UUID NOT NULL REFERENCES areas(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, area_id)
);
CREATE INDEX idx_user_areas_user_id ON user_areas(user_id);
CREATE INDEX idx_user_areas_area_id ON user_areas(area_id);

-- Migrar area_id actual de users a user_areas
INSERT INTO user_areas (user_id, area_id)
SELECT id, area_id FROM users WHERE area_id IS NOT NULL;

-- Eliminar area_id de users (reemplazado por user_areas)
ALTER TABLE users DROP COLUMN area_id;

CREATE TABLE user_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES user_groups(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, group_id)
);
CREATE INDEX idx_user_group_members_user_id ON user_group_members(user_id);
CREATE INDEX idx_user_group_members_group_id ON user_group_members(group_id);

-- Asignar admin al grupo ADMIN
INSERT INTO user_group_members (user_id, group_id)
SELECT u.id, ug.id
FROM users u, user_groups ug
WHERE u.email = 'admin@seekglobal.co' AND ug.codigo = 'ADMIN';

CREATE TABLE project_project_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  project_category_id UUID NOT NULL REFERENCES project_categories(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, project_category_id)
);
CREATE INDEX idx_ppc_project_id  ON project_project_categories(project_id);
CREATE INDEX idx_ppc_category_id ON project_project_categories(project_category_id);

CREATE TABLE project_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rol VARCHAR(50) NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, user_id, rol)
);
CREATE INDEX idx_project_users_project_id ON project_users(project_id);
CREATE INDEX idx_project_users_user_id ON project_users(user_id);
CREATE INDEX idx_project_users_activo ON project_users(activo);

CREATE TABLE time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  semana VARCHAR(10) NOT NULL,
  estado VARCHAR(50) NOT NULL DEFAULT 'PENDIENTE',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX idx_time_entries_user_id ON time_entries(user_id);
CREATE INDEX idx_time_entries_semana ON time_entries(semana);
CREATE INDEX idx_time_entries_estado ON time_entries(estado);
CREATE INDEX idx_time_entries_user_semana ON time_entries(user_id, semana);

CREATE TABLE time_entry_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  time_entry_id UUID NOT NULL REFERENCES time_entries(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id),
  income_category_id UUID REFERENCES income_categories(id),
  hours INTEGER NOT NULL,
  extra_hours INTEGER NOT NULL DEFAULT 0,
  comment TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT check_hours_range CHECK (hours >= 0),
  CONSTRAINT check_extra_hours_range CHECK (extra_hours >= 0 AND extra_hours <= 8)
);
CREATE INDEX idx_time_entry_lines_time_entry_id ON time_entry_lines(time_entry_id);
CREATE INDEX idx_time_entry_lines_project_id ON time_entry_lines(project_id);

CREATE TABLE time_entry_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  time_entry_id UUID NOT NULL REFERENCES time_entries(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  comment TEXT,
  suggested_hours INTEGER,
  suggested_extra_hours INTEGER,
  rejection_reason TEXT,
  allow_resubmit BOOLEAN DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX idx_time_entry_approvals_time_entry_id ON time_entry_approvals(time_entry_id);
CREATE INDEX idx_time_entry_approvals_created_by ON time_entry_approvals(created_by_user_id);
CREATE INDEX idx_time_entry_approvals_action ON time_entry_approvals(action);
CREATE INDEX idx_time_entry_approvals_created_at ON time_entry_approvals(created_at);

CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);

CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);

COMMIT;
