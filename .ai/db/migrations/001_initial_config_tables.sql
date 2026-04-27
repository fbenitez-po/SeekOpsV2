-- Migration: 001_initial_config_tables.sql
-- Descripción: Crear tablas de configuración del sistema
-- Fecha: 2026-04-23
-- ¿Requiere downtime? No
-- ¿Pérdida de datos potencial? No

-- ============================================
-- UP: Crear tablas de configuración
-- ============================================

BEGIN;

-- Tabla: roles (define los roles del sistema: SEEKER, GESTOR, ADMIN)
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) NOT NULL UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_roles_codigo ON roles(codigo);

-- Tabla: approval_statuses (estados posibles de un time_entry)
CREATE TABLE approval_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) NOT NULL UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_approval_statuses_codigo ON approval_statuses(codigo);

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

-- Roles del sistema
INSERT INTO roles (codigo, nombre, descripcion) VALUES
('SEEKER', 'Seeker', 'Empleado que registra horas'),
('GESTOR', 'Gestor', 'Líder que aprueba horas'),
('ADMIN', 'Admin', 'Administrador del sistema'),
('SUPERVISOR', 'Supervisor', 'Supervisor de equipos');

-- Estados de aprobación
INSERT INTO approval_statuses (codigo, nombre, descripcion) VALUES
('PENDIENTE', 'Pendiente', 'Esperando aprobación'),
('APROBADO', 'Aprobado', 'Aprobado por gestor'),
('OBSERVADO', 'Observado', 'Con observaciones del gestor'),
('RECHAZADO', 'Rechazado', 'Rechazado por gestor');

-- Categorías de ingreso
INSERT INTO income_categories (codigo, name, descripcion) VALUES
('CONSULTORIA', 'Consultoría', ''),
('DESARROLLO', 'Desarrollo', ''),
('MANTENIMIENTO', 'Mantenimiento', ''),
('SOPORTE', 'Soporte', '');

-- Categorías de cliente
INSERT INTO client_categories (codigo, name, descripcion) VALUES
('CONSULTORIA', 'Consultoría', ''),
('DESARROLLO', 'Desarrollo', ''),
('MANTENIMIENTO', 'Mantenimiento', ''),
('SOPORTE', 'Soporte', '');

-- Tipos de servicio
INSERT INTO service_types (codigo, nombre, descripcion) VALUES
('CONSULTORIA', 'Consultoría', ''),
('DESARROLLO', 'Desarrollo', ''),
('SOPORTE', 'Soporte Técnico', '');

-- Segmentaciones
INSERT INTO segmentations (codigo, nombre, descripcion) VALUES
('ENTERPRISE', 'Enterprise', 'Clientes grandes'),
('MID_MARKET', 'Mid Market', 'Clientes medianos'),
('SMB', 'SMB', 'Pequeñas y medianas empresas');

-- Equipos de trabajo
INSERT INTO teams (codigo, name, descripcion) VALUES
('BACKEND', 'Backend', 'Equipo de Backend'),
('FRONTEND', 'Frontend', 'Equipo de Frontend'),
('QA', 'QA', 'Quality Assurance'),
('DEVOPS', 'DevOps', 'DevOps'),
('FULLSTACK', 'Fullstack', 'Equipo Fullstack');

-- Áreas funcionales
INSERT INTO areas (codigo, name, descripcion) VALUES
('DESARROLLO', 'Desarrollo', 'Área de Desarrollo'),
('OPERACIONES', 'Operaciones', 'Área de Operaciones'),
('RECURSOS', 'Recursos Humanos', 'Área de RRHH'),
('DELIVERY', 'Delivery', 'Área de Delivery');

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
-- DROP TABLE IF EXISTS approval_statuses CASCADE;
-- DROP TABLE IF EXISTS roles CASCADE;
-- COMMIT;
