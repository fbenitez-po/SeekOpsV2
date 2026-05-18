# Schema de Base de Datos — Seekops

> PostgreSQL schema: tablas, columnas, relaciones, índices y decisiones.
> **Fuente de verdad:** `.ai/db/setup_schema.sql` + `.ai/db/setup_seeds.sql`
> **Última actualización:** 18 de Mayo 2026

---

## Diagrama ER Simplificado

```
┌──────────────────────────────────────────────────────────────┐
│                        CONFIGURACIÓN                          │
├──────────────────────────────────────────────────────────────┤
│ income_categories   client_categories   client_segmentations  │
│ client_sectors      service_types       project_segmentation  │
│ project_categories  productivity_layers teams   areas         │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                        ENTIDADES CORE                         │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  users ──→ team_id → teams                                    │
│    ├─→ user_areas (M2M → areas)                               │
│    ├─→ user_group_members (M2M → user_groups)                 │
│    └─→ project_users (M2M → projects, con rol)                │
│                                                               │
│  clients → projects → project_users → users                   │
│              ├─→ project_project_categories → project_categories│
│              ├─→ time_entries → time_entry_lines              │
│              │              └─→ time_entry_approvals          │
│              ├─→ hour_projections                             │
│              ├─→ ingresos                                     │
│              └─→ registros_comerciales                        │
│                                                               │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                    FINANZAS / PERÍODOS                        │
├──────────────────────────────────────────────────────────────┤
│  periodos → ingresos (proyecto_id, periodo_id)                │
│          → gastos_admin                                       │
│          → costos_venta                                       │
│          → costos_por_persona (user_id, periodo_id)           │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                      COMERCIAL                                │
├──────────────────────────────────────────────────────────────┤
│  tipos_documento ← registros_comerciales → projects, users   │
└──────────────────────────────────────────────────────────────┘
```

---

## Tablas de Configuración

### income_categories

Categorías de ingreso para líneas de carga de horas (`time_entry_lines`).

```sql
CREATE TABLE income_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo      VARCHAR(50)  NOT NULL UNIQUE,
  name        VARCHAR(100) NOT NULL,
  descripcion TEXT,
  enabled     BOOLEAN   NOT NULL DEFAULT true,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_income_categories_codigo ON income_categories(codigo);
```

**Seeds:** `CONSULTORIA`, `DESARROLLO`, `MANTENIMIENTO`, `SOPORTE`

---

### client_categories

Categorías de cliente. FK desde `clients.client_category_id` (nullable) y `hour_projections.categoria_id`.

```sql
CREATE TABLE client_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo      VARCHAR(50)  NOT NULL UNIQUE,
  name        VARCHAR(100) NOT NULL,
  descripcion TEXT,
  enabled     BOOLEAN   NOT NULL DEFAULT true,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_client_categories_codigo ON client_categories(codigo);
```

**Seeds (18):** ESTRATEGIA, GESTORES_GESTION, UX_RESEARCH, UI, DEV_FRONTEND, SEO, DEV_BACKEND, DEV_QA, UX_PROTOTYPE, DISENIO_SOCIAL_MEDIA, APOYO, UI_PROTOTYPE, UX_TESTING, LIDERES_GESTION, PRODUCT_MANAGEMENT, CAPACITACIONES, PROPUESTAS_COMERCIALES, RECLUTAMIENTO

---

### client_segmentations

Segmentación comercial del cliente.

```sql
CREATE TABLE client_segmentations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo      VARCHAR(50)  NOT NULL UNIQUE,
  name        VARCHAR(100) NOT NULL,
  descripcion TEXT,
  enabled     BOOLEAN   NOT NULL DEFAULT true,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_client_segmentations_codigo ON client_segmentations(codigo);
```

**Seeds (7):** CUENTA_CLAVE, CUENTA_INTERNACIONAL, CUENTA_DESARROLLO, CUENTA_CASUAL, CUENTA_INACTIVA, CUENTA_EXCLUIDA, NUEVOS_CLIENTES

---

### client_sectors

Sector económico del cliente.

```sql
CREATE TABLE client_sectors (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo      VARCHAR(50)  NOT NULL UNIQUE,
  name        VARCHAR(100) NOT NULL,
  descripcion TEXT,
  enabled     BOOLEAN   NOT NULL DEFAULT true,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_client_sectors_codigo ON client_sectors(codigo);
```

**Seeds (33):** CONSULTORIA, BANCA_FINANCIERO, TECNOLOGIA, TRANSPORTE, ALIMENTACION, CUIDADO_PERSONAL, INST_EDUCATIVAS, RETAIL, CONSTRUCCION, SALUD_FARMA, VARIOS, PESCA, GOBIERNO, INMOBILIARIO, ACELERADORA, MARKETING, PUBLICIDAD, LOGISTICA_SUMINISTRO, SEGUROS, TELECOMUNICACIONES, CONSUMO_MASIVO, HIDROCARBUROS, SERVICIOS, HOTELERIA_TURISMO, INDUSTRIAL, ENERGIA, CEMENTOS, EDUCACION, MINERIA, INST_DEPORTIVAS, AUTOMOTRIZ, ONG, BELLEZA

---

### service_types

Tipos de servicio ofrecido en proyectos.

```sql
CREATE TABLE service_types (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo      VARCHAR(50)  NOT NULL UNIQUE,
  name        VARCHAR(100) NOT NULL,
  descripcion TEXT,
  enabled     BOOLEAN   NOT NULL DEFAULT true,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_service_types_codigo ON service_types(codigo);
```

**Seeds:** PROYECTO, SERVICIO_RECURRENTE

---

### project_segmentation

Segmentación del proyecto (diferente a la de clientes).

```sql
CREATE TABLE project_segmentation (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo      VARCHAR(50)  NOT NULL UNIQUE,
  name        VARCHAR(100) NOT NULL,
  descripcion TEXT,
  enabled     BOOLEAN   NOT NULL DEFAULT true,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_project_segmentation_codigo ON project_segmentation(codigo);
```

**Seeds (8):** I001 (Redes Sociales), I002 (Diseño y Desarrollo de Producto), I002_DIGITAL, I003 (Branding), I004 (Product & Experience Design), I005 (SEO), I006 (Otros), I007 (Partnerships), I008 (Staff Augmentation)

---

### project_categories

Categorías del proyecto. Multi-select vía `project_project_categories`.

```sql
CREATE TABLE project_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo      VARCHAR(50)  NOT NULL UNIQUE,
  name        VARCHAR(100) NOT NULL,
  descripcion TEXT,
  enabled     BOOLEAN   NOT NULL DEFAULT true,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_project_categories_codigo ON project_categories(codigo);
```

**Seeds (34):** DESIGN_PARTNERSHIP_SQUAD, DEV_PARTNERSHIP_SQUAD, INVESTIGACION_RETO, E_COMMERCE, GESTION_ESTRATEGIA_MEDIOS, STAFF_AUG_DEV, PAGINA_WEB_CORPORATIVA, BOLSA_HORAS_DEV, INTERNO_SEEK, BOLSA_HORAS_DISENO, LANDING_PAGE, PROD_DIG_DISENO_DEV, PROD_DIG_E2E, PROD_DIG_INV_DISENO, MINISITE, PROD_DIG_DISENO_PROD, ESTRATEGIA_SEO, DISENO_SERVICIO, PROGRAMA_FIDELIZACION, SERVICIOS_DESARROLLO, BRANDING_SERVICIOS_DISENO, ESTRATEGIA_DIG_SOCIAL_MEDIA, BRANDING, ESTRATEGIA_DIG_TOOLKIT, EVAL_HEURISTICA_UX, BRANDING_BRAND_BOOK, BRANDING_OTROS, ESTRATEGIA_DIG_OTROS, STAFF_AUG_DESIGN, DISENO_ESTRATEGICO, RECLUTAMIENTO, CAPACITACION, COMERCIAL, AREA

---

### productivity_layers

Capa de productividad del proyecto.

```sql
CREATE TABLE productivity_layers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo      VARCHAR(50)  NOT NULL UNIQUE,
  name        VARCHAR(100) NOT NULL,
  descripcion TEXT,
  enabled     BOOLEAN   NOT NULL DEFAULT true,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_productivity_layers_codigo ON productivity_layers(codigo);
```

**Seeds:** OPERATIONAL_BACKBONE, CULTURE_BUILDERS, GROWTH_LEAPS

---

### teams

Equipos de trabajo de la organización.

```sql
CREATE TABLE teams (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo      VARCHAR(50)  NOT NULL UNIQUE,
  name        VARCHAR(100) NOT NULL,
  descripcion TEXT,
  enabled     BOOLEAN   NOT NULL DEFAULT true,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_teams_codigo ON teams(codigo);
```

**Seeds (13):** UI, UX, BRANDING, CLIENTE, DIRECTOR, SEO, OUTSOURCING, ADMINISTRATIVO, SOCIAL_MEDIA, ESTRATEGIA, PRODUCTO, DISENIO_EXPERIENCIA, TECNOLOGIA

---

### areas

Áreas funcionales de la empresa.

```sql
CREATE TABLE areas (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo      VARCHAR(50)  NOT NULL UNIQUE,
  name        VARCHAR(100) NOT NULL,
  descripcion TEXT,
  enabled     BOOLEAN   NOT NULL DEFAULT true,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_areas_codigo ON areas(codigo);
```

**Seeds (8):** TALENTO_CULTURA, COMERCIAL, PRODUCTO, TECNOLOGIA, ESTRATEGIA, ADMINISTRACION, DISENIO_EXPERIENCIA, OUTSOURCING

---

## Tablas Core

### users

Usuarios del sistema (Seekers, Gestores, Admins). Soft delete con `enabled`.

> **Nota:** No tiene `area_id`. Las áreas se gestionan vía `user_areas` (M2M).

```sql
CREATE TABLE users (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email            VARCHAR(255) NOT NULL UNIQUE,
  password_hash    VARCHAR(255) NOT NULL DEFAULT '$placeholder$',
  numero_documento VARCHAR(20)  NOT NULL UNIQUE,
  nombres          VARCHAR(100) NOT NULL,
  apellidos        VARCHAR(100) NOT NULL,
  puesto           VARCHAR(100) NOT NULL,
  celular          VARCHAR(20),
  avatar_url       VARCHAR(500),
  team_id          UUID NOT NULL REFERENCES teams(id),
  fecha_ingreso    DATE NOT NULL,
  enabled          BOOLEAN   NOT NULL DEFAULT true,
  staff            BOOLEAN   NOT NULL DEFAULT false,
  super_usuario    BOOLEAN   NOT NULL DEFAULT false,
  deleted_at       TIMESTAMP,
  deleted_by       VARCHAR(255),
  created_at       TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by       VARCHAR(255),
  updated_by       VARCHAR(255)
);
CREATE INDEX idx_users_email            ON users(email);
CREATE INDEX idx_users_numero_documento ON users(numero_documento);
CREATE INDEX idx_users_enabled          ON users(enabled);
CREATE INDEX idx_users_team_id          ON users(team_id);
```

---

### user_groups

Grupos de permisos del sistema.

```sql
CREATE TABLE user_groups (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo      VARCHAR(50)  NOT NULL UNIQUE,
  nombre      VARCHAR(100) NOT NULL,
  descripcion TEXT,
  enabled     BOOLEAN   NOT NULL DEFAULT true,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_user_groups_codigo ON user_groups(codigo);
```

**Seeds:** ADMIN (Administradores), SEEKER (Seekers), GESTOR (Gestores)

---

### clients

Clientes para los que se trabaja. Soft delete con `enabled`.

> **Notas:** `nombre` fue eliminado (migración 012). `razon_social` es el identificador principal (NOT NULL). `client_category_id` es nullable.

```sql
CREATE TABLE clients (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  razon_social       VARCHAR(150) NOT NULL,
  razon_comercial    VARCHAR(150),
  ruc                VARCHAR(14)  NOT NULL UNIQUE,
  nombre_contacto    VARCHAR(100),
  email_contacto     VARCHAR(255),
  telefono           VARCHAR(20),
  direccion          VARCHAR(200),
  client_category_id UUID REFERENCES client_categories(id),
  segmentation_id    UUID NOT NULL REFERENCES client_segmentations(id),
  sector_id          UUID REFERENCES client_sectors(id),
  enabled            BOOLEAN   NOT NULL DEFAULT true,
  deleted_at         TIMESTAMP,
  deleted_by         VARCHAR(255),
  created_at         TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by         VARCHAR(255),
  updated_by         VARCHAR(255)
);
CREATE INDEX idx_clients_ruc             ON clients(ruc);
CREATE INDEX idx_clients_enabled         ON clients(enabled);
CREATE INDEX idx_clients_segmentation_id ON clients(segmentation_id);
CREATE INDEX idx_clients_sector_id       ON clients(sector_id);
```

---

### projects

Proyectos de clientes. Soft delete con `enabled`.

> **Notas:** `descripcion` fue eliminado (migración 013). Tiene `fecha_inicio_real` y `fecha_fin_real` para calcular desviaciones.

```sql
CREATE TABLE projects (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code                    VARCHAR(20)  NOT NULL UNIQUE,
  nombre                  VARCHAR(100) NOT NULL,
  client_id               UUID NOT NULL REFERENCES clients(id),
  project_segmentation_id UUID NOT NULL REFERENCES project_segmentation(id),
  productivity_layer_id   UUID REFERENCES productivity_layers(id),
  service_type_id         UUID REFERENCES service_types(id),
  area_id                 UUID REFERENCES areas(id),
  gestor_id               UUID NOT NULL REFERENCES users(id),
  fecha_inicio            DATE,
  fecha_fin               DATE,
  fecha_inicio_real       DATE,
  fecha_fin_real          DATE,
  enabled                 BOOLEAN   NOT NULL DEFAULT true,
  deleted_at              TIMESTAMP,
  deleted_by              VARCHAR(255),
  created_at              TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by              VARCHAR(255),
  updated_by              VARCHAR(255),
  CONSTRAINT check_fecha_fin_mayor_inicio
    CHECK (fecha_fin IS NULL OR fecha_inicio IS NULL OR fecha_fin >= fecha_inicio)
);
CREATE INDEX idx_projects_code                    ON projects(code);
CREATE INDEX idx_projects_client_id               ON projects(client_id);
CREATE INDEX idx_projects_gestor_id               ON projects(gestor_id);
CREATE INDEX idx_projects_enabled                 ON projects(enabled);
CREATE INDEX idx_projects_project_segmentation_id ON projects(project_segmentation_id);
CREATE INDEX idx_projects_area_id                 ON projects(area_id);
```

---

## Relaciones M2M

### user_areas

Áreas asignadas a cada usuario. Un usuario debe tener al menos un área.

```sql
CREATE TABLE user_areas (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  area_id    UUID NOT NULL REFERENCES areas(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, area_id)
);
CREATE INDEX idx_user_areas_user_id ON user_areas(user_id);
CREATE INDEX idx_user_areas_area_id ON user_areas(area_id);
```

---

### user_group_members

Grupos de un usuario. Un usuario puede pertenecer a múltiples grupos.

```sql
CREATE TABLE user_group_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  group_id   UUID NOT NULL REFERENCES user_groups(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, group_id)
);
CREATE INDEX idx_user_group_members_user_id  ON user_group_members(user_id);
CREATE INDEX idx_user_group_members_group_id ON user_group_members(group_id);
```

---

### project_project_categories

Categorías de un proyecto. Multi-select.

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

---

### project_users

Usuarios asignados a un proyecto con su rol. Soft delete con `enabled`.

```sql
CREATE TABLE project_users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rol        VARCHAR(50) NOT NULL,
  enabled    BOOLEAN   NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, user_id, rol)
);
CREATE INDEX idx_project_users_project_id ON project_users(project_id);
CREATE INDEX idx_project_users_user_id    ON project_users(user_id);
CREATE INDEX idx_project_users_enabled    ON project_users(enabled);
```

---

## Tablas Transaccionales

### time_entries

Registros semanales de horas (cabecera). Un registro por (usuario, semana).

```sql
CREATE TABLE time_entries (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  semana     VARCHAR(10) NOT NULL,
  estado     VARCHAR(50) NOT NULL DEFAULT 'PENDIENTE',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by VARCHAR(255),
  updated_by VARCHAR(255)
);
CREATE INDEX idx_time_entries_user_id     ON time_entries(user_id);
CREATE INDEX idx_time_entries_semana      ON time_entries(semana);
CREATE INDEX idx_time_entries_estado      ON time_entries(estado);
CREATE INDEX idx_time_entries_user_semana ON time_entries(user_id, semana);
```

**Estados:** PENDIENTE → APROBADO (final) | OBSERVADO → PENDIENTE (ciclo) | RECHAZADO (final)

---

### time_entry_lines

Líneas de detalle de cada carga. Una línea por proyecto.

> **Nota:** `hours` y `extra_hours` son NUMERIC(x,1) para permitir medias horas (0.5, 1.5, etc.). Constraint requiere múltiplos de 0.5.

```sql
CREATE TABLE time_entry_lines (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  time_entry_id      UUID NOT NULL REFERENCES time_entries(id) ON DELETE CASCADE,
  project_id         UUID NOT NULL REFERENCES projects(id),
  income_category_id UUID REFERENCES income_categories(id),
  hours              NUMERIC(6,1) NOT NULL,
  extra_hours        NUMERIC(4,1) NOT NULL DEFAULT 0,
  comment            TEXT,
  created_at         TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT check_hours_range       CHECK (hours >= 0 AND MOD(hours, 0.5) = 0),
  CONSTRAINT check_extra_hours_range CHECK (extra_hours >= 0 AND extra_hours <= 8 AND MOD(extra_hours, 0.5) = 0)
);
CREATE INDEX idx_time_entry_lines_time_entry_id ON time_entry_lines(time_entry_id);
CREATE INDEX idx_time_entry_lines_project_id    ON time_entry_lines(project_id);
```

---

### time_entry_approvals

Historial completo de todas las acciones sobre un time entry.

```sql
CREATE TABLE time_entry_approvals (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  time_entry_id         UUID NOT NULL REFERENCES time_entries(id) ON DELETE CASCADE,
  action                VARCHAR(50) NOT NULL,
  comment               TEXT,
  suggested_hours       NUMERIC(6,1),
  suggested_extra_hours NUMERIC(4,1),
  rejection_reason      TEXT,
  allow_resubmit        BOOLEAN DEFAULT true,
  created_at            TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by            VARCHAR(255)
);
CREATE INDEX idx_time_entry_approvals_time_entry_id ON time_entry_approvals(time_entry_id);
CREATE INDEX idx_time_entry_approvals_created_by    ON time_entry_approvals(created_by);
CREATE INDEX idx_time_entry_approvals_action        ON time_entry_approvals(action);
CREATE INDEX idx_time_entry_approvals_created_at    ON time_entry_approvals(created_at);
```

---

### refresh_tokens / password_reset_tokens

Tokens de sesión y recuperación de contraseña.

```sql
CREATE TABLE refresh_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  token      TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE password_reset_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  token      TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

---

### hour_projections

Proyecciones de horas del gestor para un usuario en un proyecto.

> **Nota:** `horas_proyectadas` es NUMERIC(8,1) con constraint de múltiplos de 0.5. `categoria_id` es opcional (FK a `client_categories`).

```sql
CREATE TABLE hour_projections (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  categoria_id      UUID REFERENCES client_categories(id) ON DELETE SET NULL,
  fecha_inicio      DATE         NOT NULL,
  fecha_fin         DATE         NOT NULL,
  horas_proyectadas NUMERIC(8,1) NOT NULL,
  notas             TEXT,
  created_at        TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by        VARCHAR(255),
  updated_by        VARCHAR(255),
  CONSTRAINT check_projection_dates  CHECK (fecha_fin >= fecha_inicio),
  CONSTRAINT check_horas_proyectadas CHECK (horas_proyectadas > 0 AND MOD(horas_proyectadas, 0.5) = 0)
);
CREATE INDEX idx_hour_projections_project_id   ON hour_projections(project_id);
CREATE INDEX idx_hour_projections_user_id      ON hour_projections(user_id);
CREATE INDEX idx_hour_projections_project_user ON hour_projections(project_id, user_id);
CREATE INDEX idx_hour_projections_fechas       ON hour_projections(fecha_inicio, fecha_fin);
CREATE INDEX idx_hour_projections_categoria_id ON hour_projections(categoria_id);
```

---

## Finanzas — Períodos

### periodos

Períodos mensuales con estado abierto/cerrado. Seed: Jan 2026 → May 2028. Jan–Mar 2026 cerrados.

```sql
CREATE TABLE periodos (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mes          INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
  anio         INTEGER NOT NULL CHECK (anio >= 2020),
  esta_cerrado BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_periodos_mes_anio UNIQUE (mes, anio)
);
CREATE INDEX idx_periodos_anio     ON periodos(anio);
CREATE INDEX idx_periodos_anio_mes ON periodos(anio, mes);
```

---

### ingresos

Ingresos por proyecto y período. Un ingreso por (proyecto, período).

```sql
CREATE TABLE ingresos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID NOT NULL REFERENCES projects(id)  ON DELETE CASCADE,
  periodo_id  UUID NOT NULL REFERENCES periodos(id)  ON DELETE CASCADE,
  monto       NUMERIC(14,2) NOT NULL CHECK (monto >= 0),
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by  VARCHAR(255),
  updated_by  VARCHAR(255),
  CONSTRAINT uq_ingresos_proyecto_periodo UNIQUE (proyecto_id, periodo_id)
);
CREATE INDEX idx_ingresos_proyecto_id ON ingresos(proyecto_id);
CREATE INDEX idx_ingresos_periodo_id  ON ingresos(periodo_id);
```

---

### gastos_admin

Gastos administrativos por período. Múltiples líneas por período con código libre.

```sql
CREATE TABLE gastos_admin (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  periodo_id  UUID NOT NULL REFERENCES periodos(id) ON DELETE CASCADE,
  codigo      VARCHAR(50) NOT NULL,
  descripcion VARCHAR(255),
  monto       NUMERIC(14,2) NOT NULL CHECK (monto >= 0),
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by  VARCHAR(255),
  updated_by  VARCHAR(255)
);
CREATE INDEX idx_gastos_admin_periodo_id ON gastos_admin(periodo_id);
```

---

### costos_venta

Costos de venta por período. Misma estructura que `gastos_admin`, categoría separada.

```sql
CREATE TABLE costos_venta (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  periodo_id  UUID NOT NULL REFERENCES periodos(id) ON DELETE CASCADE,
  codigo      VARCHAR(50) NOT NULL,
  descripcion VARCHAR(255),
  monto       NUMERIC(14,2) NOT NULL CHECK (monto >= 0),
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by  VARCHAR(255),
  updated_by  VARCHAR(255)
);
CREATE INDEX idx_costos_venta_periodo_id ON costos_venta(periodo_id);
```

---

### costos_por_persona

Remuneración por persona por período. Un registro por (usuario, período).

```sql
CREATE TABLE costos_por_persona (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  periodo_id    UUID NOT NULL REFERENCES periodos(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
  remuneracion  NUMERIC(14,2) NOT NULL CHECK (remuneracion >= 0),
  dias_habiles  INTEGER NOT NULL CHECK (dias_habiles > 0),
  horas_por_dia INTEGER NOT NULL DEFAULT 8 CHECK (horas_por_dia > 0),
  created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by    VARCHAR(255),
  updated_by    VARCHAR(255),
  UNIQUE (periodo_id, user_id)
);
CREATE INDEX idx_costos_por_persona_periodo_id ON costos_por_persona(periodo_id);
CREATE INDEX idx_costos_por_persona_user_id    ON costos_por_persona(user_id);
```

---

## Comercial

### tipos_documento

Catálogo de tipos de documento comercial.

```sql
CREATE TABLE tipos_documento (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre     VARCHAR(100) NOT NULL UNIQUE,
  enabled    BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

**Seeds:** Orden de Compra, Contrato, Propuesta, Addendum, Carta de Intención, Factura Proforma, Otro

---

### registros_comerciales

Registros comerciales (propuestas, contratos, etc.) vinculados a proyectos.

```sql
CREATE TABLE registros_comerciales (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha_registro    DATE NOT NULL,
  proyecto_id       UUID NOT NULL REFERENCES projects(id),
  responsable_id    UUID NOT NULL REFERENCES users(id),
  detalle           TEXT,
  precio            NUMERIC(12,2) NOT NULL CHECK (precio >= 0),
  moneda            VARCHAR(3) NOT NULL DEFAULT 'PEN',
  tipo_documento_id UUID REFERENCES tipos_documento(id),
  estado_contrato   BOOLEAN NOT NULL DEFAULT false,
  facturacion       BOOLEAN NOT NULL DEFAULT false,
  evidencia_nombre  VARCHAR(500),
  created_at        TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by        VARCHAR(255),
  updated_by        VARCHAR(255)
);
CREATE INDEX idx_registros_comerciales_proyecto_id    ON registros_comerciales(proyecto_id);
CREATE INDEX idx_registros_comerciales_responsable_id ON registros_comerciales(responsable_id);
CREATE INDEX idx_registros_comerciales_fecha_registro ON registros_comerciales(fecha_registro DESC);
```

---

## Relaciones (Resumen)

| Tabla A | Relación | Tabla B | Implementación |
|---------|----------|---------|----------------|
| users | N:1 | teams | FK team_id |
| users | M:N | areas | via user_areas |
| users | M:N | user_groups | via user_group_members |
| users | M:N | projects | via project_users (con rol) |
| users | 1:N | projects | FK gestor_id |
| users | 1:N | time_entries | FK user_id |
| users | 1:N | costos_por_persona | FK user_id |
| clients | N:0..1 | client_categories | FK client_category_id (nullable) |
| clients | N:1 | client_segmentations | FK segmentation_id |
| clients | N:0..1 | client_sectors | FK sector_id (nullable) |
| clients | 1:N | projects | FK client_id |
| projects | N:1 | project_segmentation | FK project_segmentation_id |
| projects | N:0..1 | productivity_layers | FK productivity_layer_id (nullable) |
| projects | N:0..1 | service_types | FK service_type_id (nullable) |
| projects | N:0..1 | areas | FK area_id (nullable) |
| projects | M:N | project_categories | via project_project_categories |
| projects | 1:N | hour_projections | FK project_id |
| projects | 1:N | ingresos | FK proyecto_id |
| projects | 1:N | registros_comerciales | FK proyecto_id |
| time_entries | 1:N | time_entry_lines | FK time_entry_id |
| time_entries | 1:N | time_entry_approvals | FK time_entry_id |
| time_entry_lines | N:0..1 | income_categories | FK income_category_id (nullable) |
| hour_projections | N:0..1 | client_categories | FK categoria_id (nullable) |
| periodos | 1:N | ingresos | FK periodo_id |
| periodos | 1:N | gastos_admin | FK periodo_id |
| periodos | 1:N | costos_venta | FK periodo_id |
| periodos | 1:N | costos_por_persona | FK periodo_id |
| tipos_documento | 1:N | registros_comerciales | FK tipo_documento_id |

> **Nota auditoría:** Los campos `created_by` y `updated_by` son `VARCHAR(255)` (email). No son FK — no aparecen en esta tabla de relaciones.

---

## Decisiones de Diseño

### UUIDs como Primary Keys
Todos los IDs son UUID (`gen_random_uuid()`). No expone secuencias, compatible con escalabilidad horizontal.

### Soft Deletes
Campo `enabled` (boolean) en `users`, `clients`, `projects`, `project_users`. Queries filtran `WHERE enabled = true`. Las tablas con soft delete también tienen `deleted_at` (timestamp de baja) y `deleted_by` (email del responsable).

### Auditoría
Todas las tablas tienen `created_at` y `updated_at`. Los campos `created_by` y `updated_by` almacenan el **email** del usuario que realizó la acción (`VARCHAR(255)`, sin FK). Esto simplifica queries y evita dependencias circulares.

### Horas en NUMERIC
`hours`, `extra_hours` y `horas_proyectadas` son `NUMERIC` (no INTEGER) para soportar medias horas (0.5). Constraints requieren que sean múltiplos de 0.5.

### area_id en projects es nullable
Proyectos pueden o no pertenecer a un área. La UI lo controla con un checkbox.

### client_category_id en clients es nullable
La categoría se eliminó del formulario de alta (ya no es obligatoria).

### razon_social como identificador principal de clients
El campo `nombre` fue eliminado. `razon_social` es el campo principal (NOT NULL).

### time_entry_approvals como historial completo
Cada acción (aprobación, observación, rechazo) genera un registro. No se sobreescribe el estado.

### Acceso del Gestor a proyectos
Un Gestor tiene acceso a todos los proyectos donde figura como `gestor_id`, independientemente de si tiene fila en `project_users`. Validado en tres puntos del backend.

### Períodos financieros pre-cargados
La tabla `periodos` se inicializa con un seed de Jan 2026 → May 2028. Los primeros 3 meses (Jan–Mar 2026) arrancan cerrados.

### Convención de nombres de columnas
- Tablas de configuración/lookup: columna de nombre en inglés (`name`). Excepción: `user_groups.nombre` y `tipos_documento.nombre` (conservan español por coherencia con su dominio).
- `projects.nombre` conserva español (nombre del proyecto).
- Columnas de auditoría estandarizadas: `enabled`, `deleted_at`, `deleted_by`, `created_by`, `updated_by` (todos VARCHAR email, sin FK).

---

## Resumen de Tablas

| Grupo | Tablas |
|-------|--------|
| Configuración | income_categories, client_categories, client_segmentations, client_sectors, service_types, project_segmentation, project_categories, productivity_layers, teams, areas |
| Core | users, user_groups, clients, projects |
| M2M | user_areas, user_group_members, project_project_categories, project_users |
| Transaccional | time_entries, time_entry_lines, time_entry_approvals, refresh_tokens, password_reset_tokens, hour_projections |
| Finanzas | periodos, ingresos, gastos_admin, costos_venta, costos_por_persona |
| Comercial | tipos_documento, registros_comerciales |
| **Total** | **31 tablas** |

---

## Archivos SQL

```bash
# Setup completo (base limpia):
psql "<connection_string>" -f .ai/db/setup_schema.sql
psql "<connection_string>" -f .ai/db/setup_seeds.sql
```

- **`setup_schema.sql`** — DDL completo: DROP + CREATE de todas las tablas, índices y constraints
- **`setup_seeds.sql`** — Seeds: catálogos, usuario admin inicial
- **`migrations/`** — Historial de migraciones individuales (001–020) para referencia
