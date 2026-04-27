-- Migration: 002_core_tables.sql
-- Descripción: Crear tablas core (users, clients, projects) y user_groups
-- Fecha: 2026-04-23
-- ¿Requiere downtime? No
-- ¿Pérdida de datos potencial? No
-- Dependencias: 001_initial_config_tables.sql debe ejecutarse primero

-- ============================================
-- UP: Crear tablas core
-- ============================================

BEGIN;

-- Tabla: users
-- FKs de creación/actualización son nullable para permitir seed inicial
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

-- Tabla: user_groups (grupos que determinan el rol del usuario en el sistema)
-- Códigos SEEKER, GESTOR, ADMIN coinciden con los códigos de roles
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

-- Seeds: grupos del sistema (códigos alineados con roles para facilitar la consulta)
INSERT INTO user_groups (codigo, nombre, descripcion) VALUES
('ADMIN', 'Administradores', 'Acceso total al sistema'),
('SEEKER', 'Seekers', 'Registro de horas trabajadas'),
('GESTOR', 'Gestores', 'Aprobación de horas del equipo');

-- Tabla: clients
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
  segmentation_id UUID NOT NULL REFERENCES segmentations(id),
  sector_id UUID REFERENCES sectors(id),

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

-- Tabla: projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) NOT NULL UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,

  client_id UUID NOT NULL REFERENCES clients(id),
  segmentation_id UUID NOT NULL REFERENCES segmentations(id),
  income_category_id UUID NOT NULL REFERENCES income_categories(id),
  productivity_layer_id UUID REFERENCES income_categories(id),
  service_type_id UUID REFERENCES service_types(id),

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
CREATE INDEX idx_projects_income_category_id ON projects(income_category_id);

-- ============================================
-- SEED: Usuario administrador inicial
-- Contraseña: Admin123! (bcrypt 10 rounds)
-- Hash generado para uso en desarrollo — cambiar en producción
-- ============================================

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
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'Admin', 'Seekops', '00000001', 'Administrador del Sistema',
    v_team_id, v_area_id, '2024-01-01', true, true, true
  )
  RETURNING id INTO v_user_id;
END $$;

COMMIT;

-- ============================================
-- DOWN: Eliminar tablas core
-- ============================================

-- BEGIN;
-- DROP TABLE IF EXISTS projects CASCADE;
-- DROP TABLE IF EXISTS clients CASCADE;
-- DROP TABLE IF EXISTS user_groups CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;
-- COMMIT;
