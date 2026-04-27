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
│ • roles                    • approval_statuses            │
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

- **roles:** Tipos de rol del sistema (Seeker, Gestor, Admin, Supervisor)
- **approval_statuses:** Estados de aprobación de time entries (PENDIENTE, APROBADO, OBSERVADO, RECHAZADO)
- **income_categories:** Categorías de ingreso para proyectos tipo "Area"
- **service_types:** Tipos de servicio (Consultoría, Desarrollo, etc.)
- **segmentations:** Segmentaciones de mercado (Enterprise, Mid Market, SMB)
- **sectors:** Sectores económicos (Tecnología, Finanzas, etc.)
- **teams:** Equipos de trabajo
- **areas:** Áreas funcionales de la empresa
- **users:** Usuarios del sistema (Seekers, Gestores, Admins)
- **user_groups:** Grupos de permisos (Administradores, Seekers, Gestores)
- **user_group_members:** Relación M2M entre usuarios y grupos
- **clients:** Clientes para los que se trabaja
- **projects:** Proyectos de clientes
- **project_users:** Relación M2M entre usuarios y proyectos con roles asignados
- **time_entries:** Registros semanales de horas (cabecera)
- **time_entry_lines:** Líneas detalladas de horas por proyecto dentro de cada entrada
- **time_entry_approvals:** Historial de acciones (aprobación, observación, rechazo) en time entries

---

## Tablas de Configuración

### roles

**Descripción:** Tipos de rol disponibles en el sistema (read-only, prellenada).

```sql
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) NOT NULL UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Data seed:
-- ('SEEKER', 'Seeker', 'Empleado que registra horas'),
-- ('GESTOR', 'Gestor', 'Líder que aprueba horas'),
-- ('ADMIN', 'Admin', 'Administrador del sistema'),
-- ('SUPERVISOR', 'Supervisor', 'Supervisor de equipos')
```

**Índices:**
- `idx_roles_codigo`: búsqueda por código (asignación de roles)

```sql
CREATE INDEX idx_roles_codigo ON roles(codigo);
```

---

### approval_statuses

**Descripción:** Estados posibles de un time entry (read-only, prellenada).

```sql
CREATE TABLE approval_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) NOT NULL UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Data seed:
-- ('PENDIENTE', 'Pendiente', 'Esperando aprobación'),
-- ('APROBADO', 'Aprobado', 'Aprobado por gestor'),
-- ('OBSERVADO', 'Observado', 'Con observaciones del gestor'),
-- ('RECHAZADO', 'Rechazado', 'Rechazado por gestor')
```

**Índices:**
- `idx_approval_statuses_codigo`: búsqueda por código

```sql
CREATE INDEX idx_approval_statuses_codigo ON approval_statuses(codigo);
```

---

### income_categories

**Descripción:** Categorías de ingreso para proyectos tipo "Area".

```sql
CREATE TABLE income_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) NOT NULL UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Data seed examples:
-- ('CONSULTORÍA', 'Consultoría', ''),
-- ('DESARROLLO', 'Desarrollo', ''),
-- ('MANTENIMIENTO', 'Mantenimiento', '')
```

**Índices:**
- `idx_income_categories_codigo`: búsqueda por código

```sql
CREATE INDEX idx_income_categories_codigo ON income_categories(codigo);
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

-- Data seed examples:
-- ('CONSULTORÍA', 'Consultoría'),
-- ('DESARROLLO', 'Desarrollo'),
-- ('SOPORTE', 'Soporte Técnico')
```

**Índices:**
- `idx_service_types_codigo`: búsqueda por código

```sql
CREATE INDEX idx_service_types_codigo ON service_types(codigo);
```

---

### segmentations

**Descripción:** Segmentaciones de mercado (Enterprise, Mid Market, SMB).

```sql
CREATE TABLE segmentations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) NOT NULL UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Data seed:
-- ('ENTERPRISE', 'Enterprise', 'Clientes grandes'),
-- ('MID_MARKET', 'Mid Market', 'Clientes medianos'),
-- ('SMB', 'SMB', 'Pequeñas y medianas empresas')
```

**Índices:**
- `idx_segmentations_codigo`: búsqueda por código

```sql
CREATE INDEX idx_segmentations_codigo ON segmentations(codigo);
```

---

### sectors

**Descripción:** Sectores económicos (Tecnología, Finanzas, etc.).

```sql
CREATE TABLE sectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) NOT NULL UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Data seed examples:
-- ('TECNOLOGÍA', 'Tecnología'),
-- ('FINANZAS', 'Finanzas'),
-- ('RETAIL', 'Retail')
```

**Índices:**
- `idx_sectors_codigo`: búsqueda por código

```sql
CREATE INDEX idx_sectors_codigo ON sectors(codigo);
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

-- Data seed examples:
-- ('BACKEND', 'Backend'),
-- ('FRONTEND', 'Frontend'),
-- ('QA', 'Quality Assurance')
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

-- Data seed examples:
-- ('DESARROLLO', 'Desarrollo'),
-- ('OPERACIONES', 'Operaciones'),
-- ('RECURSOS', 'Recursos Humanos')
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
  area_id UUID NOT NULL REFERENCES areas(id),
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
  
  categoria_usuario_id UUID NOT NULL REFERENCES income_categories(id),
  segmentacion_id UUID NOT NULL REFERENCES segmentations(id),
  sector_id UUID REFERENCES sectors(id),
  
  activo BOOLEAN NOT NULL DEFAULT true,
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id),
  updated_by UUID NOT NULL REFERENCES users(id)
);

CREATE INDEX idx_clients_ruc ON clients(ruc);
CREATE INDEX idx_clients_activo ON clients(activo);
CREATE INDEX idx_clients_segmentacion_id ON clients(segmentacion_id);
CREATE INDEX idx_clients_sector_id ON clients(sector_id);
```

**Índices:**
- `idx_clients_ruc`: búsqueda por RUC (unicidad)
- `idx_clients_activo`: filtrar clientes activos
- `idx_clients_segmentacion_id`: listar clientes por segmentación
- `idx_clients_sector_id`: listar clientes por sector

---

### projects

**Descripción:** Proyectos de clientes. Soft delete con campo `activo`.

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(20) NOT NULL UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  
  cliente_id UUID NOT NULL REFERENCES clients(id),
  segmentacion_id UUID NOT NULL REFERENCES segmentations(id),
  categoria_ingreso_id UUID NOT NULL REFERENCES income_categories(id),
  capa_productividad_id UUID REFERENCES income_categories(id),
  tipo_servicio_id UUID REFERENCES service_types(id),
  
  gestor_id UUID NOT NULL REFERENCES users(id),
  
  fecha_inicio DATE,
  fecha_fin DATE,
  
  activo BOOLEAN NOT NULL DEFAULT true,
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id),
  updated_by UUID NOT NULL REFERENCES users(id),
  
  CONSTRAINT check_fecha_fin_mayor_inicio 
    CHECK (fecha_fin IS NULL OR fecha_inicio IS NULL OR fecha_fin >= fecha_inicio)
);

CREATE INDEX idx_projects_codigo ON projects(codigo);
CREATE INDEX idx_projects_cliente_id ON projects(cliente_id);
CREATE INDEX idx_projects_gestor_id ON projects(gestor_id);
CREATE INDEX idx_projects_activo ON projects(activo);
CREATE INDEX idx_projects_categoria_ingreso_id ON projects(categoria_ingreso_id);
```

**Índices:**
- `idx_projects_codigo`: búsqueda por código
- `idx_projects_cliente_id`: listar proyectos de un cliente
- `idx_projects_gestor_id`: listar proyectos de un gestor
- `idx_projects_activo`: filtrar proyectos activos
- `idx_projects_categoria_ingreso_id`: filtrar por categoría

---

### project_users

**Descripción:** Relación M2M entre usuarios y proyectos. Un usuario puede tener roles en múltiples proyectos. Soft delete con campo `activo`.

```sql
CREATE TABLE project_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rol_id UUID NOT NULL REFERENCES roles(id),
  
  activo BOOLEAN NOT NULL DEFAULT true,
  
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id),
  updated_by UUID NOT NULL REFERENCES users(id),
  
  UNIQUE(proyecto_id, usuario_id, rol_id)
);

CREATE INDEX idx_project_users_proyecto_id ON project_users(proyecto_id);
CREATE INDEX idx_project_users_usuario_id ON project_users(usuario_id);
CREATE INDEX idx_project_users_rol_id ON project_users(rol_id);
CREATE INDEX idx_project_users_activo ON project_users(activo);
```

**Índices:**
- `idx_project_users_proyecto_id`: listar usuarios de un proyecto
- `idx_project_users_usuario_id`: listar proyectos de un usuario
- `idx_project_users_rol_id`: listar asignaciones por rol
- `idx_project_users_activo`: filtrar asignaciones activas

---

### time_entries

**Descripción:** Registros semanales de horas (cabecera). Almacena la semana y estado general.

```sql
CREATE TABLE time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES users(id),
  semana VARCHAR(10) NOT NULL,  -- Ej: "S15/24"
  
  estado_id UUID NOT NULL REFERENCES approval_statuses(id),
  
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
CREATE INDEX idx_time_entries_estado_id ON time_entries(estado_id);
CREATE INDEX idx_time_entries_usuario_semana ON time_entries(usuario_id, semana);
```

**Índices:**
- `idx_time_entries_usuario_id`: listar cargas de un usuario
- `idx_time_entries_semana`: buscar por semana
- `idx_time_entries_estado_id`: filtrar por estado
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
  estado_anterior_id UUID REFERENCES approval_statuses(id),
  estado_nuevo_id UUID NOT NULL REFERENCES approval_statuses(id),
  
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
| users | 1:N | time_entries | FK usuario_id |
| users | 1:N | project_users | FK usuario_id |
| users | 1:N | user_group_members | FK usuario_id |
| users | 1:N | projects | FK gestor_id |
| users | 1:N | time_entry_approvals | FK created_by |
| users | N:1 | teams | FK equipo_id |
| users | N:1 | areas | FK area_id |
| clients | 1:N | projects | FK cliente_id |
| projects | 1:N | time_entries | Indirecto (via project_users) |
| projects | 1:N | project_users | FK proyecto_id |
| projects | 1:N | time_entry_lines | FK proyecto_id |
| projects | N:1 | income_categories | FK categoria_ingreso_id |
| time_entries | 1:N | time_entry_lines | FK time_entry_id |
| time_entries | 1:N | time_entry_approvals | FK time_entry_id |
| user_groups | 1:N | user_group_members | FK grupo_id |
| roles | 1:N | project_users | FK rol_id |
| approval_statuses | 1:N | time_entries | FK estado_id |
| approval_statuses | 1:N | time_entry_approvals | FK estado_nuevo_id |

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
- **Decisión:** Índices en `activo`, `estado_id`, `semana`, `rol_id`, etc.
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
