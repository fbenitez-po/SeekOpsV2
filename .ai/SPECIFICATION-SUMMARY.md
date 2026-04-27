# Specification Summary — Seekops Campos y Validaciones

> Documento centralizado de referencia técnica para desarrollo Backend + Frontend + BD  
> **Actualizado:** 23 de Abril 2026  
> **Fuente:** Historias de Usuario + Especificaciones de Pantalla

---

## Índice

1. [Formularios Seeker](#formularios-seeker)
2. [Formularios Gestor](#formularios-gestor)
3. [Formularios Admin](#formularios-admin)
4. [Validaciones Globales](#validaciones-globales)
5. [Estados y Transiciones](#estados-y-transiciones)
6. [Campos de Auditoría](#campos-de-auditoría)

---

## Formularios Seeker

### US-001: Cargar Horas

**Endpoint:** POST /time-entries  
**Pantalla:** S-01-CARGAR-HORAS / S-01-HOME-SEEKER (Sección 4)

#### Selector de Semana
- **Campo:** semana (date)
- **Type:** Date picker con navegación [← →]
- **Default:** Semana actual
- **Validación:** Cualquier semana (sin límite retroactivo)
- **Display:** Formato "SAAS/YY" (ej: S15/24)

#### Tabla de Proyectos (dinámico, múltiples filas)
| Campo | Type | Requerido | Validación | Notas |
|-------|------|-----------|-----------|-------|
| proyecto_id | Dropdown/FK | ✓ | Único en la misma carga, solo asignados al seeker | Excluye proyectos ya usados |
| categoria_ingreso_id | Dropdown/FK | Condicional | Solo habilitado si proyecto='Area' | Foreign key a tabla categorías |
| horas | Integer | ✓ | 0-24 | Error: "Máximo 24 horas" |
| horas_extra | Integer | No | 0-8 | Error: "Máximo 8 horas extras" |
| comentario | Text | No | Max 500 chars | Textarea |

#### Respuesta Éxito
```json
{
  "id": "uuid",
  "usuario_id": "uuid",
  "semana": "S15/24",
  "estado": "PENDIENTE",
  "lineas": [
    {
      "proyecto_id": "uuid",
      "horas": 8,
      "horas_extra": 2,
      "comentario": "texto"
    }
  ],
  "fecha_carga": "2026-04-23T14:30:00Z"
}
```

---

### US-003: Ajustar Horas Observadas

**Endpoint:** PUT /time-entries/:id  
**Pantalla:** S-01-AJUSTAR-HORAS

#### Campos Editables
| Campo | Type | Requerido | Validación |
|-------|------|-----------|-----------|
| horas | Integer | ✓ | 0-24 |
| horas_extra | Integer | No | 0-8 |
| comentario | Text | No | Max 500 chars |

**Notas:**
- Proyecto NO es editable (referencia inmutable)
- Al guardar: estado vuelve a "PENDIENTE"
- Se dispara email a gestor automáticamente

---

## Formularios Gestor

### US-006: Aprobar/Observar/Rechazar Horas

**Endpoints:** 
- POST /time-entries/:id/approve
- POST /time-entries/:id/observe
- POST /time-entries/:id/reject

**Pantalla:** S-02-HOME-GESTOR / S-02-OBSERVACION / S-02-RECHAZO

#### S-02-OBSERVACION
| Campo | Type | Requerido |
|-------|------|-----------|
| comentario_observacion | Text | ✓ |
| sugerencia_horas | Integer | No |
| sugerencia_extras | Integer | No |

#### S-02-RECHAZO
| Campo | Type | Requerido |
|-------|------|-----------|
| razon_rechazo | Text | ✓ |
| permitir_reenvio | Boolean | No |

---

## Formularios Admin

### Crear/Editar Usuario

**Endpoint:** POST /users (crear) | PUT /users/:id (editar)  
**Pantallas:** S-03-USUARIO-CREAR / S-03-USUARIO-EDITAR

#### Información Personal (Editables)
| Campo | Type | Requerido | Validación | Editable en CREAR | Editable en EDITAR |
|-------|------|-----------|-----------|-------------------|-------------------|
| email | Email | ✓ | Único, formato válido | ✓ | ✗ |
| nombres | Text | ✓ | Max 100 | ✓ | ✓ |
| apellidos | Text | ✓ | Max 100 | ✓ | ✓ |
| numero_documento | Text | ✓ | 6-20 dígitos, único | ✓ | ✓ |
| puesto | Text/Dropdown | ✓ | Max 100 | ✓ | ✓ |
| celular | Text | No | Formato tel | ✓ | ✓ |
| avatar_url | File | No | JPG/PNG, máx 2MB | ✓ | ✓ |

#### Información de Trabajo (Editables)
| Campo | Type | Requerido | Validación | 
|-------|------|-----------|-----------|
| equipo_id | FK | ✓ | Relacionado a tabla equipos |
| area_id | FK | ✓ | Relacionado a tabla areas |
| fecha_ingreso | Date | ✓ | No puede ser futura |

#### Permisos y Estado (Editables)
| Campo | Type | Requerido | Valores |
|-------|------|-----------|--------|
| activo | Boolean | ✓ | true/false |
| staff | Boolean | No | true/false |
| super_usuario | Boolean | No | true/false |
| grupos | Array(FK) | ✓ | Administradores, Seekers, Gestores |

#### Histórico (Solo Lectura)
| Campo | Type | Display |
|-------|------|---------|
| registrado_en | DateTime | "15/03/2023 10:30" |
| actualizado_en | DateTime | "22/04/2026 14:15" |
| desactivado_en | DateTime | "—" si nunca fue desactivado |

#### Asociaciones (Editables)
- **Proyectos asociados:** Array(FK), removibles
- **Usuarios asociados por proyecto:** Array(FK), por proyecto, removibles

---

### Crear/Editar Cliente

**Endpoint:** POST /clients (crear) | PUT /clients/:id (editar)  
**Pantallas:** S-03-CLIENTE-CREAR / S-03-CLIENTE-EDITAR

#### Información Comercial (Editables)
| Campo | Type | Requerido | Validación |
|-------|------|-----------|-----------|
| nombre | Text | ✓ | Max 100 |
| razon_social | Text | No | Max 150 |
| razon_comercial | Text | No | Max 150 |
| ruc | Text | ✓ | 11-14 dígitos |

#### Contacto (Editables)
| Campo | Type | Requerido | Validación |
|-------|------|-----------|-----------|
| nombre_contacto | Text | No | Max 100 |
| email_contacto | Email | No | Formato válido |
| telefono | Text | No | Formato telefónico |
| direccion | Text | No | Max 200 |

#### Categoría y Segmentación (Editables)
| Campo | Type | Requerido | Valores |
|-------|------|-----------|--------|
| categoria_usuario_id | FK | ✓ | Corporativo, PYME, etc |
| segmentacion_id | FK | ✓ | Enterprise, Mid Market, SMB |
| sector_id | FK | No | Tecnología, Finanzas, etc |

#### Estado (Editable)
| Campo | Type | Requerido | Default |
|-------|------|-----------|---------|
| activo | Boolean | ✓ | true |

#### Asociaciones (Editables)
- **Proyectos asociados:** Array(FK), removibles
- **Usuarios asociados por proyecto:** Array(FK), por proyecto, removibles

---

### Crear/Editar Proyecto

**Endpoint:** POST /projects (crear) | PUT /projects/:id (editar)  
**Pantallas:** S-03-PROYECTO-CREAR / S-03-PROYECTO-EDITAR

#### Información Básica (Editables)
| Campo | Type | Requerido | Validación |
|-------|------|-----------|-----------|
| codigo | Text | ✓ | Único, alfanumérico + guiones, máx 20 |
| nombre | Text | ✓ | Max 100 |
| cliente_id | FK | ✓ | Relacionado a tabla clientes (activos) |
| descripcion | Text | No | Max 500 |

#### Configuración (Editables)
| Campo | Type | Requerido | Validación |
|-------|------|-----------|-----------|
| segmentacion_id | FK | ✓ | Debe corresponder al cliente |
| categoria_ingreso_id | FK | ✓ | Tipos de categoría |
| capa_productividad_id | FK | No | Relacionado a config |
| tipo_servicio_id | FK | No | Consultoría, Desarrollo, etc |
| gestor_id | FK | ✓ | Usuario con rol Gestor, activo |
| activo | Boolean | ✓ | true/false |

#### Fechas (Editables)
| Campo | Type | Requerido | Validación |
|-------|------|-----------|-----------|
| fecha_inicio | Date | No | Formato DD/MM/YYYY |
| fecha_fin | Date | No | No puede ser < fecha_inicio |

#### Asociaciones (Editables)
- **Usuarios asignados:** Array(FK + rol), con roles por proyecto

---

## Validaciones Globales

### Email
- Formato válido (RFC 5322 basic)
- Único en el sistema

### Documentos
- Solo dígitos
- Rango: 6-20 caracteres
- Único en el sistema

### Teléfonos
- Formato internacional: +[país][número]
- Ej: +5165432100

### Fechas
- Formato: DD/MM/YYYY (display)
- Almacenamiento: ISO 8601 (BD)
- No pueden ser futuras (salvo fecha_fin de proyectos)

### Textos
- Trimmed (sin espacios al inicio/fin)
- Max caracteres según campo
- No permitir HTML/scripts

### Números (Horas)
- Solo positivos
- Horas: 0-24 (validación server: 0-8 ó 0-12 según política)
- Horas Extra: 0-8
- Mensajes de error específicos por rango

---

## Estados y Transiciones

### TimeEntry (Cargas de Horas)

```
PENDIENTE
  ↓ [Gestor aprueba]
  APROBADO (final, no reversible)
  
PENDIENTE
  ↓ [Gestor observa]
  OBSERVADO
  ↓ [Seeker ajusta]
  PENDIENTE (vuelve a estar pendiente)
  
PENDIENTE
  ↓ [Gestor rechaza]
  RECHAZADO (final, no editable)
```

### User

```
ACTIVO → INACTIVO (soft delete)
INACTIVO → ACTIVO (reactivación)
```

### Client / Project

```
ACTIVO → INACTIVO (soft delete)
INACTIVO → ACTIVO (reactivación)
```

---

## Campos de Auditoría

### Todos las entidades deben tener:

| Campo | Type | Automático |
|-------|------|-----------|
| id | UUID | ✓ |
| creado_en | DateTime | ✓ |
| actualizado_en | DateTime | ✓ |
| creado_por_usuario_id | FK | ✓ |
| actualizado_por_usuario_id | FK | ✓ |

### TimeEntry específico:

| Campo | Type | Notas |
|-------|------|-------|
| version | Integer | Para auditoría de cambios |
| estado_anterior | ENUM | Para tracking de transiciones |
| motivo_cambio | Text | Observación/Rechazo/etc |

---

## Restricciones de Base de Datos

### Unique Constraints
- users.email
- users.numero_documento
- projects.codigo
- clientes.ruc

### Foreign Keys
- user.equipo_id → equipos
- user.area_id → areas
- user.grupos (junction table)
- time_entry.usuario_id → users
- time_entry.proyecto_id → projects
- proyecto.cliente_id → clientes
- proyecto.gestor_id → users (con validación rol)

### Soft Deletes
- users (activo = false)
- clients (activo = false)
- projects (activo = false)

---

## Endpoints API Summary

| Método | Ruta | Cuerpo | Respuesta |
|--------|------|--------|----------|
| POST | /time-entries | TimeEntry[] | TimeEntry (creado) |
| PUT | /time-entries/:id | {horas, horas_extra, comentario} | TimeEntry (actualizado) |
| GET | /time-entries | - | TimeEntry[] |
| POST | /time-entries/:id/approve | - | {status: "APROBADO"} |
| POST | /time-entries/:id/observe | {comentario, sugerencia_*} | {status: "OBSERVADO"} |
| POST | /time-entries/:id/reject | {razon_rechazo} | {status: "RECHAZADO"} |
| POST | /users | User | User (creado) |
| PUT | /users/:id | User (parcial) | User (actualizado) |
| GET | /users | - | User[] |
| POST | /clients | Client | Client (creado) |
| PUT | /clients/:id | Client (parcial) | Client (actualizado) |
| GET | /clients | - | Client[] |
| POST | /projects | Project | Project (creado) |
| PUT | /projects/:id | Project (parcial) | Project (actualizado) |
| GET | /projects | - | Project[] |

---

**Documento centralizado de referencia. Consultar historias de usuario e especificaciones de pantalla para más detalle.**
