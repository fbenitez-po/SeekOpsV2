# Schema de Base de Datos — Seekops

> PostgreSQL schema: tablas, columnas, relaciones, índices y decisiones.  
> **Generado:** 23 de Abril 2026  
> **Basado en:** SPECIFICATION-SUMMARY.md + CLAUDE.md

---

## Diagrama ER Simplificado

```
┌─────────────────────────────────────────────────────────┐
│                    CONFIGURACIÓN                         │
├─────────────────────────────────────────────────────────┤
│ • income_categories        • service_types               │
│ • segmentations            • sectors                      │
│ • teams                    • areas                        │
│ • income_categories        • service_types               │
│ • segmentations           • sectors                       │
│ • teams                   • areas                         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    ENTIDADES CORE                        │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  users ──→ [Multiple roles] ←──┐                         │
│    ├─→ user_group_members      │                         │
│    ├─→ user_areas (M2M)        │                         │
│    ├─→ project_users ──────┐   │                         │
│    └─→ time_entry_approvals│   │                         │
│                             │   │                         │
│  clients ─→ projects ───────┤───┴─→ users                │
│              ├─→ project_users                           │
│              ├─→ time_entries ─→ time_entry_lines        │
│              └─→ time_entry_approvals                    │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

---

## Entidades Identificadas

### Configuración de Clientes
- **client_categories:** Categorías de cliente (renombrado de `income_categories` para clientes)
- **client_segmentations:** Segmentaciones de clientes (renombrado de `segmentations`)
- **client_sectors:** Sectores económicos del cliente (renombrado de `sectors`)

### Configuración de Proyectos
- **income_categories:** Categorías de ingreso usadas en líneas de carga de horas (`time_entry_lines`)
- **project_categories:** Categorías de ingreso del proyecto (multi-select, M2M con projects)
- **project_segmentation:** Segmentación del proyecto (tabla propia, separada de clientes)
- **productivity_layers:** Capa de productividad del proyecto (tabla propia)
- **service_types:** Tipos de servicio (Consultoría, Desarrollo, etc.)

### Configuración General
- **teams:** Equipos de trabajo
- **areas:** Áreas funcionales de la empresa

### Core
- **users:** Usuarios del sistema (Seekers, Gestores, Admins)
- **user_groups:** Grupos de permisos (Administradores, Seekers, Gestores)
- **user_group_members:** Relación M2M entre usuarios y grupos
- **clients:** Clientes para los que se trabaja
- **projects:** Proyectos de clientes

### Relaciones
- **user_areas:** Relación M2M entre usuarios y áreas (mínimo 1 requerida)
- **project_users:** Relación M2M entre usuarios y proyectos con roles asignados
- **project_project_categories:** Relación M2M entre proyectos y sus categorías (multi-select)

### Transaccional
- **time_entries:** Registros semanales de horas (cabecera)
- **time_entry_lines:** Líneas detalladas de horas por proyecto
- **time_entry_approvals:** Historial de acciones (aprobación, observación, rechazo)

---

## Tablas de Configuración

### income_categories

**Descripción:** Categorías de ingreso usadas en líneas de carga de horas (`time_entry_lines`). No se usa directamente en proyectos.

```sql
CREATE TABLE income_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  descripcion TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO income_categories (codigo, name) VALUES
  ('CONSULTORIA',   'Consultoría'),
  ('DESARROLLO',    'Desarrollo'),
  ('MANTENIMIENTO', 'Mantenimiento'),
  ('SOPORTE',       'Soporte');
```

**Índices:**
- `idx_income_categories_codigo`: búsqueda por código

```sql
CREATE INDEX idx_income_categories_codigo ON income_categories(codigo);
```

---

### client_categories

**Descripción:** Categorías de cliente (ej: tipo de relación comercial). Exclusivo de `clients`.

```sql
CREATE TABLE client_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  descripcion TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

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
```

**Índices:**
- `idx_client_categories_codigo`

```sql
CREATE INDEX idx_client_categories_codigo ON client_categories(codigo);
```

---

### client_segmentations

**Descripción:** Segmentación de mercado del cliente (Enterprise, Mid Market, SMB). Exclusivo de `clients`. *(Renombrado de `segmentations` en migration 005.)*

```sql
CREATE TABLE client_segmentations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) NOT NULL UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO client_segmentations (codigo, nombre) VALUES
  ('CUENTA_CLAVE',          'Cuenta Clave'),
  ('CUENTA_INTERNACIONAL',  'Cuenta Internacional'),
  ('CUENTA_DESARROLLO',     'Cuenta Desarrollo'),
  ('CUENTA_CASUAL',         'Cuenta Casual'),
  ('CUENTA_INACTIVA',       'Cuenta Inactiva'),
  ('CUENTA_EXCLUIDA',       'Cuenta Excluida'),
  ('NUEVOS_CLIENTES',       'Nuevos Clientes');
```

**Índices:**
- `idx_client_segmentations_codigo`

```sql
CREATE INDEX idx_client_segmentations_codigo ON client_segmentations(codigo);
```

---

### client_sectors

**Descripción:** Sector económico del cliente (Tecnología, Finanzas, etc.). Exclusivo de `clients`. *(Renombrado de `sectors` en migration 005.)*

```sql
CREATE TABLE client_sectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) NOT NULL UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

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
```

**Índices:**
- `idx_client_sectors_codigo`

```sql
CREATE INDEX idx_client_sectors_codigo ON client_sectors(codigo);
```

---

### project_segmentation

**Descripción:** Segmentación del proyecto. Tabla propia, separada de la segmentación de clientes. Exclusivo de `projects`.

```sql
CREATE TABLE project_segmentation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) NOT NULL UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO project_segmentation (codigo, nombre, descripcion) VALUES
  ('ENTERPRISE', 'Enterprise',  'Proyectos de clientes grandes'),
  ('MID_MARKET', 'Mid Market',  'Proyectos de clientes medianos'),
  ('SMB',        'SMB',         'Proyectos de clientes pequeños');
```

**Índices:**
- `idx_project_segmentation_codigo`

```sql
CREATE INDEX idx_project_segmentation_codigo ON project_segmentation(codigo);
```

---

### project_categories

**Descripción:** Categorías de ingreso del proyecto. Multi-select: un proyecto puede tener varias. Se relaciona vía `project_project_categories` (M2M).

```sql
CREATE TABLE project_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) NOT NULL UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO project_categories (codigo, nombre) VALUES
  ('CONSULTORIA',   'Consultoría'),
  ('DESARROLLO',    'Desarrollo'),
  ('MANTENIMIENTO', 'Mantenimiento'),
  ('SOPORTE',       'Soporte');
```

**Índices:**
- `idx_project_categories_codigo`

```sql
CREATE INDEX idx_project_categories_codigo ON project_categories(codigo);
```

---

### productivity_layers

**Descripción:** Capa de productividad del proyecto. Tabla propia, separada de `income_categories`. Exclusivo de `projects`.

```sql
CREATE TABLE productivity_layers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) NOT NULL UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Seeds iniciales — ajustar según definición de negocio
INSERT INTO productivity_layers (codigo, nombre) VALUES
  ('ALTA',  'Alta'),
  ('MEDIA', 'Media'),
  ('BAJA',  'Baja');
```

**Índices:**
- `idx_productivity_layers_codigo`

```sql
CREATE INDEX idx_productivity_layers_codigo ON productivity_layers(codigo);
```

---

### service_types

**Descripción:** Tipos de servicio ofrecido en proyectos (Consultoría, Desarrollo, etc.).

```sql
CREATE TABLE service_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) NOT NULL UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

**Índices:**
- `idx_service_types_codigo`: búsqueda por código

```sql
CREATE INDEX idx_service_types_codigo ON service_types(codigo);
```

---

### teams

**Descripción:** Equipos de trabajo dentro de la organización.

```sql
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) NOT NULL UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

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
```

**Índices:**
- `idx_teams_codigo`: búsqueda por código

```sql
CREATE INDEX idx_teams_codigo ON teams(codigo);
```

---

### areas

**Descripción:** Áreas funcionales de la empresa.

```sql
CREATE TABLE areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) NOT NULL UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO areas (codigo, name) VALUES
  ('TALENTO_CULTURA',    'Talento & Cultura'),
  ('COMERCIAL',          'Comercial'),
  ('PRODUCTO',           'Producto'),
  ('TECNOLOGIA',         'Tecnología'),
  ('ESTRATEGIA',         'Estrategia'),
  ('ADMINISTRACION',     'Administración'),
  ('DISENIO_EXPERIENCIA','Diseño de Experiencia'),
  ('OUTSOURCING',        'Outsourcing');
```

**Índices:**
- `idx_areas_codigo`: búsqueda por código

```sql
CREATE INDEX idx_areas_codigo ON areas(codigo);
```

---

## Tablas Core

### users

**Descripción:** Usuarios del sistema (Seekers, Gestores, Admins). Soft delete con campo `activo`.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  numero_documento VARCHAR(20) NOT NULL UNIQUE,
  nombres VARCHAR(100) NOT NULL,
  apellidos VARCHAR(100) NOT NULL,
  puesto VARCHAR(100) NOT NULL,
  celular VARCHAR(20),
  avatar_url VARCHAR(500),
  
  equipo_id UUID NOT NULL REFERENCES teams(id),
  -- area_id eliminado: reemplazado por tabla user_areas (M2M)
  fecha_ingreso DATE NOT NULL,
  
  activo BOOLEAN NOT NULL DEFAULT true,
  staff BOOLEAN NOT NULL DEFAULT false,
  super_usuario BOOLEAN NOT NULL DEFAULT false,
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  
  CONSTRAINT fk_users_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_users_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_numero_documento ON users(numero_documento);
CREATE INDEX idx_users_activo ON users(activo);
CREATE INDEX idx_users_equipo_id ON users(equipo_id);
CREATE INDEX idx_users_area_id ON users(area_id);
```

**Índices:**
- `idx_users_email`: búsqueda por email (login, unicidad)
- `idx_users_numero_documento`: búsqueda por documento
- `idx_users_activo`: filtrar usuarios activos (soft delete)
- `idx_users_equipo_id`: listar usuarios por equipo
- `idx_users_area_id`: listar usuarios por área

---

### user_groups

**Descripción:** Grupos de permisos del sistema (Administradores, Seekers, Gestores).

```sql
CREATE TABLE user_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) NOT NULL UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Data seed:
-- ('ADMINISTRADORES', 'Administradores', 'Acceso total'),
-- ('SEEKERS', 'Seekers', 'Registro de horas'),
-- ('GESTORES', 'Gestores', 'Aprobación de horas')
```

**Índices:**
- `idx_user_groups_codigo`: búsqueda por código

```sql
CREATE INDEX idx_user_groups_codigo ON user_groups(codigo);
```

---

### user_group_members

**Descripción:** Relación M2M entre usuarios y grupos. Un usuario puede pertenecer a múltiples grupos.

```sql
CREATE TABLE user_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  grupo_id UUID NOT NULL REFERENCES user_groups(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  UNIQUE(usuario_id, grupo_id)
);

CREATE INDEX idx_user_group_members_usuario_id ON user_group_members(usuario_id);
CREATE INDEX idx_user_group_members_grupo_id ON user_group_members(grupo_id);
```

**Índices:**
- `idx_user_group_members_usuario_id`: listar grupos de un usuario
- `idx_user_group_members_grupo_id`: listar usuarios de un grupo

---

### clients

**Descripción:** Clientes para los que se trabaja. Soft delete con campo `activo`.

```sql
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

  client_category_id  UUID NOT NULL REFERENCES client_categories(id),
  segmentation_id     UUID NOT NULL REFERENCES client_segmentations(id),
  sector_id           UUID REFERENCES client_sectors(id),

  activo BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_clients_ruc            ON clients(ruc);
CREATE INDEX idx_clients_activo         ON clients(activo);
CREATE INDEX idx_clients_segmentation_id ON clients(segmentation_id);
CREATE INDEX idx_clients_sector_id      ON clients(sector_id);
```

**Índices:**
- `idx_clients_ruc`: búsqueda por RUC (unicidad)
- `idx_clients_activo`: filtrar clientes activos
- `idx_clients_segmentation_id`: listar clientes por segmentación
- `idx_clients_sector_id`: listar clientes por sector

---

### projects

**Descripción:** Proyectos de clientes. Soft delete con campo `activo`.

**Nota:** `project_categories` es multi-select y se maneja vía la tabla M2M `project_project_categories`.

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) NOT NULL UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,

  client_id               UUID NOT NULL REFERENCES clients(id),
  project_segmentation_id UUID NOT NULL REFERENCES project_segmentation(id),
  productivity_layer_id   UUID REFERENCES productivity_layers(id),
  service_type_id         UUID REFERENCES service_types(id),

  gestor_id UUID NOT NULL REFERENCES users(id),
  area_id   UUID REFERENCES areas(id),  -- opcional: área específica del proyecto

  fecha_inicio DATE,
  fecha_fin    DATE,

  activo BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,

  CONSTRAINT check_fecha_fin_mayor_inicio
    CHECK (fecha_fin IS NULL OR fecha_inicio IS NULL OR fecha_fin >= fecha_inicio)
);

CREATE INDEX idx_projects_code                    ON projects(code);
CREATE INDEX idx_projects_client_id               ON projects(client_id);
CREATE INDEX idx_projects_gestor_id               ON projects(gestor_id);
CREATE INDEX idx_projects_activo                  ON projects(activo);
CREATE INDEX idx_projects_project_segmentation_id ON projects(project_segmentation_id);
CREATE INDEX idx_projects_area_id                 ON projects(area_id);
```

### project_project_categories

**Descripción:** Relación M2M entre proyectos y sus categorías de ingreso. Un proyecto puede tener múltiples categorías seleccionadas.

```sql
CREATE TABLE project_project_categories (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  project_category_id UUID NOT NULL REFERENCES project_categories(id),
  created_at          TIMESTAMP NOT NULL DEFAULT NOW(),

  UNIQUE(project_id, project_category_id)
);

CREATE INDEX idx_ppc_project_id  ON project_project_categories(project_id);
CREATE INDEX idx_ppc_category_id ON project_project_categories(project_category_id);
```

**Índices:**
- `idx_projects_code`: búsqueda por código
- `idx_projects_client_id`: listar proyectos de un cliente
- `idx_projects_gestor_id`: listar proyectos de un gestor
- `idx_projects_activo`: filtrar proyectos activos
- `idx_projects_project_segmentation_id`: filtrar por segmentación
- `idx_ppc_project_id`: categorías de un proyecto
- `idx_ppc_category_id`: proyectos por categoría (reportes)

---

### project_users

**Descripción:** Relación M2M entre usuarios y proyectos. Un usuario puede tener roles en múltiples proyectos. Soft delete con campo `activo`.

```sql
CREATE TABLE project_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rol VARCHAR(50) NOT NULL,
  
  activo BOOLEAN NOT NULL DEFAULT true,
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id),
  updated_by UUID NOT NULL REFERENCES users(id),
  
  UNIQUE(proyecto_id, usuario_id, rol)
);

CREATE INDEX idx_project_users_proyecto_id ON project_users(proyecto_id);
CREATE INDEX idx_project_users_usuario_id ON project_users(usuario_id);
CREATE INDEX idx_project_users_activo ON project_users(activo);
```

**Índices:**
- `idx_project_users_proyecto_id`: listar usuarios de un proyecto
- `idx_project_users_usuario_id`: listar proyectos de un usuario
- `idx_project_users_activo`: filtrar asignaciones activas

---

### time_entries

**Descripción:** Registros semanales de horas (cabecera). Almacena la semana y estado general.

```sql
CREATE TABLE time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES users(id),
  semana VARCHAR(10) NOT NULL,  -- Ej: "S15/24"
  
  estado VARCHAR(50) NOT NULL DEFAULT 'PENDIENTE',
  
  fecha_carga TIMESTAMP NOT NULL DEFAULT NOW(),
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id),
  updated_by UUID NOT NULL REFERENCES users(id),
  
  CONSTRAINT fk_time_entries_usuario_id FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_time_entries_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_time_entries_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_time_entries_usuario_id ON time_entries(usuario_id);
CREATE INDEX idx_time_entries_semana ON time_entries(semana);
CREATE INDEX idx_time_entries_estado ON time_entries(estado);
CREATE INDEX idx_time_entries_usuario_semana ON time_entries(usuario_id, semana);
```

**Índices:**
- `idx_time_entries_usuario_id`: listar cargas de un usuario
- `idx_time_entries_semana`: buscar por semana
- `idx_time_entries_estado`: filtrar por estado
- `idx_time_entries_usuario_semana`: combo para evitar duplicados (usuario + semana única implícitamente)

---

### time_entry_lines

**Descripción:** Líneas detalladas de cada time entry. Cada línea es un proyecto con sus horas.

```sql
CREATE TABLE time_entry_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  time_entry_id UUID NOT NULL REFERENCES time_entries(id) ON DELETE CASCADE,
  proyecto_id UUID NOT NULL REFERENCES projects(id),
  categoria_ingreso_id UUID REFERENCES income_categories(id),
  
  horas INTEGER NOT NULL,
  horas_extra INTEGER NOT NULL DEFAULT 0,
  comentario TEXT,
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT check_horas_range CHECK (horas >= 0 AND horas <= 24),
  CONSTRAINT check_horas_extra_range CHECK (horas_extra >= 0 AND horas_extra <= 8)
);

CREATE INDEX idx_time_entry_lines_time_entry_id ON time_entry_lines(time_entry_id);
CREATE INDEX idx_time_entry_lines_proyecto_id ON time_entry_lines(proyecto_id);
```

**Índices:**
- `idx_time_entry_lines_time_entry_id`: listar líneas de una carga
- `idx_time_entry_lines_proyecto_id`: listar líneas de un proyecto (reportes)

---

### time_entry_approvals

**Descripción:** Historial de aprobaciones, observaciones, rechazos y ajustes en time entries.

```sql
CREATE TABLE time_entry_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  time_entry_id UUID NOT NULL REFERENCES time_entries(id) ON DELETE CASCADE,
  
  tipo_accion VARCHAR(50) NOT NULL,  -- 'APROBACIÓN', 'OBSERVACIÓN', 'RECHAZO', 'AJUSTE'
  
  comentario TEXT,
  sugerencia_horas INTEGER,
  sugerencia_extras INTEGER,
  razon_rechazo TEXT,
  permitir_reenvio BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id)
);

CREATE INDEX idx_time_entry_approvals_time_entry_id ON time_entry_approvals(time_entry_id);
CREATE INDEX idx_time_entry_approvals_created_by ON time_entry_approvals(created_by);
CREATE INDEX idx_time_entry_approvals_tipo_accion ON time_entry_approvals(tipo_accion);
CREATE INDEX idx_time_entry_approvals_created_at ON time_entry_approvals(created_at);
```

**Índices:**
- `idx_time_entry_approvals_time_entry_id`: listar historial de una carga
- `idx_time_entry_approvals_created_by`: listar acciones de un gestor (auditoría)
- `idx_time_entry_approvals_tipo_accion`: filtrar por tipo de acción
- `idx_time_entry_approvals_created_at`: ordenar por fecha para reportes

---

## Relaciones (Resumen)

| Tabla A | Relación | Tabla B | Implementación |
|---------|----------|---------|---|
| users | N:1 | teams | FK team_id |
| users | M:N | areas | via user_areas |
| users | 1:N | user_group_members | FK user_id |
| users | 1:N | project_users | FK user_id |
| users | 1:N | projects | FK gestor_id |
| users | 1:N | time_entries | FK user_id |
| users | 1:N | time_entry_approvals | FK created_by |
| user_groups | 1:N | user_group_members | FK group_id |
| clients | N:1 | client_categories | FK client_category_id |
| clients | N:1 | client_segmentations | FK segmentation_id |
| clients | N:0..1 | client_sectors | FK sector_id (nullable) |
| clients | 1:N | projects | FK client_id |
| projects | N:1 | project_segmentation | FK project_segmentation_id |
| projects | N:0..1 | productivity_layers | FK productivity_layer_id (nullable) |
| projects | N:0..1 | service_types | FK service_type_id (nullable) |
| projects | M:N | project_categories | via project_project_categories |
| projects | 1:N | project_users | FK project_id |
| projects | 1:N | time_entry_lines | FK project_id |
| time_entries | 1:N | time_entry_lines | FK time_entry_id |
| time_entries | 1:N | time_entry_approvals | FK time_entry_id |
| time_entry_lines | N:0..1 | income_categories | FK income_category_id (nullable, solo proyectos tipo Area) |


---

## Decisiones de Diseño

### **UUIDs como Primary Keys**
- **Decisión:** Todos los IDs son UUID (gen_random_uuid())
- **Justificación:** Permite escalabilidad horizontal, no expone secuencias, seguridad débil (no predecibles). Estándar en APIs modernas.
- **Trade-off:** Campos más grandes (16 bytes vs 8 bytes), índices ligeramente más lentos pero aceptables en escala de 200 usuarios.

### **Soft Deletes**
- **Decisión:** Campo `activo` (boolean) en users, clients, projects, project_users
- **Justificación:** Preserva historial, permite reactivar sin conflictos, facilita auditoría. Decisión explícita en CLAUDE.md.
- **Implementación:** Queries deben filtrar `WHERE activo = true`. Índices en campo activo.

### **Auditoria Completa**
- **Decisión:** Todas las tablas tienen `created_at`, `updated_at`, `created_by`, `updated_by`
- **Justificación:** Trazabilidad completa de cambios (quién, cuándo). Crítico para cumplimiento.
- **Trade-off:** Columnas adicionales, pero overhead mínimo.

### **time_entry_lines como tabla separada**
- **Decisión:** Las líneas de cada carga (proyectos) están en tabla separada, no como JSON
- **Justificación:** Permite queries complejas (reportes por proyecto), integridad referencial, indexación correcta. Alternativa (JSON) sería más simple pero menos queryable.

### **time_entry_approvals como historial completo**
- **Decisión:** Cada acción (aprobación, observación, rechazo, ajuste) es un registro histórico
- **Justificación:** Auditoría completa de transiciones, permite análisis de procesos, no se pierden datos. Alternativa (sobrescribir estado) sería más simple pero menos informativo.

### **Restricción: No se puede desaprobar**
- **Decisión:** Una vez APROBADO, el estado es final
- **Justificación:** Decisión de producto (CLAUDE.md: "Aprobación: No reversible"). Se implementa a nivel de aplicación (no de BD).

### **Auto-aprobación de gestores permitida**
- **Decisión:** Un gestor puede cargarse horas a sí mismo en su proyecto
- **Justificación:** Decisión de producto (CLAUDE.md). Se valida en aplicación: si usuario = gestor de proyecto, estado = APROBADO inmediatamente.

### **Categoría de ingreso condicional**
- **Decisión:** `categoria_ingreso_id` en `time_entry_lines` es NULL si el proyecto no es tipo "Area"
- **Justificación:** Especificación (SPECIFICATION-SUMMARY.md): campo solo habilitado si proyecto = Area.
- **Implementación:** Constraint de aplicación (no de BD).

### **Unique: (proyecto_id, usuario_id, rol_id) en project_users**
- **Decisión:** Un usuario no puede tener el mismo rol asignado dos veces en un proyecto
- **Justificación:** Evita duplicados, permite múltiples roles por usuario en el mismo proyecto.

### **Timestamps automáticos con NOW()**
- **Decisión:** `created_at` y `updated_at` con DEFAULT NOW()
- **Justificación:** Consistencia, evita errores de cliente, truthy audit trail. Aplicación actualiza `updated_at` con UPDATE.

### **Email y documento UNIQUE**
- **Decisión:** Constraints UNIQUE en users.email y users.numero_documento
- **Justificación:** Especificación (SPECIFICATION-SUMMARY.md): ambos deben ser únicos globales.

### **Soft delete vs Foreign Key ON DELETE**
- **Decisión:** FK usa ON DELETE CASCADE para relaciones dependientes (user_group_members, project_users), ON DELETE SET NULL para auditoría (created_by)
- **Justificación:** Dependientes se eliminan lógicamente con su padre. Auditoria se preserva (no se pierden registros de quién creó qué).

### **Índices en Foreign Keys**
- **Decisión:** Todos los FK tienen índices
- **Justificación:** Mejora performance de JOINs y filtros. Crítico para queries frecuentes (listar proyectos de usuario, etc.).

### **Índices en campos filtrados frecuentemente**
- **Decisión:** Índices en `activo`, `estado`, `semana`, etc.
- **Justificación:** Speeding up WHERE clauses comunes (filtrar por activos, estado, período, rol).

---

## Alternativas Descartadas

### **Usar SERIAL en lugar de UUID**
- **Descartada porque:** Expone secuencias (información sobre cantidad de registros), imposibilita escalabilidad horizontal, menos seguro.

### **Almacenar categoría_ingreso en time_entries**
- **Descartada porque:** Redundancia con project_users y dificultad para reportes detallados. Mejor tener líneas separadas.

### **Usar JSONB para time_entry_lines**
- **Descartada porque:** Menor queryabilidad, imposibilita índices por proyecto, rompe integridad referencial. Mejor relacional.

### **Almacenar historial de aprobaciones como campos en time_entries**
- **Descartada porque:** Imposibilita auditoría completa, solo guarda último estado, no soporta análisis de procesos.

### **Usar booleans para estados (aprobado, observado, rechazado)**
- **Descartada porque:** No es escalable (qué si hay nuevos estados?), confuso (qué pasa si dos son true?), mejor usar enum/FK.

### **Hard delete (eliminar registros)**
- **Descartada porque:** Pierde historial, imposibilita reactivar, viola trazabilidad. Soft delete es decisión arquitectónica del proyecto.

### **Autoincrementales para user_groups, roles, etc.**
- **Descartada porque:** Los id nunca se exponen en API, UUID es más escalable. El código referencia el campo `codigo` (ej: 'SEEKER').

---

## Restricciones de Base de Datos

### Unique Constraints
```sql
ALTER TABLE users ADD CONSTRAINT unique_users_email UNIQUE(email);
ALTER TABLE users ADD CONSTRAINT unique_users_documento UNIQUE(numero_documento);
ALTER TABLE projects ADD CONSTRAINT unique_projects_codigo UNIQUE(codigo);
ALTER TABLE clients ADD CONSTRAINT unique_clients_ruc UNIQUE(ruc);
ALTER TABLE project_users ADD CONSTRAINT unique_project_users UNIQUE(proyecto_id, usuario_id, rol_id);
```

### Foreign Keys con ON DELETE
```
-- Dependientes (CASCADE):
user_group_members.usuario_id → users.id ON DELETE CASCADE
user_group_members.grupo_id → user_groups.id ON DELETE CASCADE
project_users.proyecto_id → projects.id ON DELETE CASCADE
project_users.usuario_id → users.id ON DELETE CASCADE
time_entries.usuario_id → users.id ON DELETE CASCADE
time_entry_lines.time_entry_id → time_entries.id ON DELETE CASCADE
time_entry_approvals.time_entry_id → time_entries.id ON DELETE CASCADE

-- Auditoría (SET NULL):
users.created_by → users.id ON DELETE SET NULL
users.updated_by → users.id ON DELETE SET NULL
clients.created_by → users.id ON DELETE SET NULL
clients.updated_by → users.id ON DELETE SET NULL
projects.created_by → users.id ON DELETE SET NULL
projects.updated_by → users.id ON DELETE SET NULL
project_users.created_by → users.id ON DELETE SET NULL
project_users.updated_by → users.id ON DELETE SET NULL
time_entries.created_by → users.id ON DELETE SET NULL
time_entries.updated_by → users.id ON DELETE SET NULL
time_entry_approvals.created_by → users.id ON DELETE SET NULL
```

### Check Constraints
```sql
ALTER TABLE projects ADD CONSTRAINT check_fecha_fin_mayor_inicio 
  CHECK (fecha_fin IS NULL OR fecha_inicio IS NULL OR fecha_fin >= fecha_inicio);

ALTER TABLE time_entry_lines ADD CONSTRAINT check_horas_range 
  CHECK (horas >= 0 AND horas <= 24);
  
ALTER TABLE time_entry_lines ADD CONSTRAINT check_horas_extra_range 
  CHECK (horas_extra >= 0 AND horas_extra <= 8);
```

---

## Migraciones

**Estado:** Pendiente (crear con `/db-migration-write`)

Notas:
- Primera migración: crear todas las tablas de configuración (roles, statuses, etc.) con data seeds
- Segunda migración: crear tablas core (users, clients, projects)
- Tercera migración: crear tablas de relaciones (project_users, user_group_members, time_entries)
- Considerar: triggers para actualizar `updated_at` automáticamente

---

## Notas de Diseño

- **Escala:** 50-200 usuarios activos, 20-50 proyectos, miles de time_entries anuales. Índices suficientes.
- **Auditoría:** Todas las entidades tracean quién creó/modificó y cuándo.
- **Soft delete:** Implementado con campo `activo`. Queries siempre filtran activos.
- **Transacciones:** Aplicación debe usar transacciones para operaciones multi-tabla (crear time_entry + líneas).
- **Timezone:** Usar UTC en BD, convertir en aplicación.
- **Validación:** Constraints de BD son solo respaldo. Validación principal en aplicación (rangos, formatos, lógica de negocio).

---

**Documento generado por `/db-schema-design` el 23 de Abril 2026.**
