# Contratos de API REST — Seekops

> Contratos completos de todos los endpoints: método, ruta, request, responses, validaciones y errores.  
> **Basado en:** historias de usuario + `backend/prisma/schema.prisma`.
> ⚠️ **El contrato real lo definen los schemas Zod (`backend/src/modules/*/**.schema.ts`) + la capa mapper.** Ante cualquier discrepancia, manda el código.

> ⚠️ **Prefijo de API:** Todas las rutas listadas abajo (excepto `/health`) se sirven bajo `env.API_PREFIX`, default **`/api/v1`** (configurable por env). Ej.: `POST /auth/login` se invoca como `POST /api/v1/auth/login`. Los verbos están anglicizados: `/approve`, `/observe`, `/reject`, `/import`, `/document-types` (ver `docs/decisions.md` → 2026-05-19).

> ℹ️ **Errores de validación:** además de `{ error: string }`, los 400 por validación de Zod incluyen un campo aditivo `details: [{ field, message }]` con todos los issues. Los consumidores que leen `error` siguen funcionando.

---

## Índice de Endpoints

| Dominio | Método | Ruta | Autenticado |
|---------|--------|------|-------------|
| **Auth** | POST | /auth/login | ❌ |
| **Auth** | POST | /auth/logout | ✅ |
| **Auth** | POST | /auth/refresh-token | ✅ |
| **Auth** | POST | /auth/solicitar-reset | ❌ |
| **Auth** | POST | /auth/confirmar-reset | ❌ |
| **Time Entries** | GET | /time-entries | ✅ |
| **Time Entries** | POST | /time-entries | ✅ Seeker/Gestor |
| **Time Entries** | GET | /time-entries/:id | ✅ |
| **Time Entries** | POST | /time-entries/:id/approve | ✅ Gestor/Admin |
| **Time Entries** | POST | /time-entries/:id/observe | ✅ Gestor/Admin |
| **Time Entries** | POST | /time-entries/:id/reject | ✅ Gestor/Admin |
| **Usuarios** | GET | /users | ✅ Admin |
| **Usuarios** | POST | /users | ✅ Admin |
| **Usuarios** | GET | /users/:id | ✅ Admin |
| **Usuarios** | PUT | /users/:id | ✅ Admin |
| **Usuarios** | PATCH | /users/:id/toggle-activo | ✅ Admin |
| **Clientes** | GET | /clients | ✅ Admin |
| **Clientes** | POST | /clients | ✅ Admin |
| **Clientes** | GET | /clients/:id | ✅ Admin |
| **Clientes** | PUT | /clients/:id | ✅ Admin |
| **Clientes** | PATCH | /clients/:id/toggle-activo | ✅ Admin |
| **Proyectos** | GET | /projects | ✅ |
| **Proyectos** | POST | /projects | ✅ Admin |
| **Proyectos** | GET | /projects/:id | ✅ |
| **Proyectos** | PUT | /projects/:id | ✅ Admin |
| **Proyectos** | PATCH | /projects/:id/toggle-activo | ✅ Admin |
| **Proyectos** | POST | /projects/:id/usuarios | ✅ Admin |
| **Proyectos** | DELETE | /projects/:id/usuarios/:usuario_id | ✅ Admin |
| **Config** | GET | /config/equipos | ✅ |
| **Config** | GET | /config/areas | ✅ |
| **Config** | GET | /config/grupos | ✅ Admin |
| **Config** | GET | /config/categorias-proyecto | ✅ |
| **Config** | GET | /config/segmentaciones | ✅ Admin |
| **Config** | GET | /config/sectores | ✅ Admin |
| **Config** | GET | /config/tipos-servicio | ✅ Admin |

---

## AUTH

---

### POST /auth/login

> Autenticación de usuario con email y contraseña. Retorna JWT de acceso y refresh token.

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "email": "string — email del usuario",
  "password": "string — contraseña"
}
```

**201 — Éxito:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "expires_in": 3600,
  "usuario": {
    "id": "uuid",
    "email": "juan@seekglobal.co",
    "nombres": "Juan",
    "apellidos": "Pérez",
    "avatar_url": "https://...",
    "roles": ["SEEKER", "GESTOR"],
    "proyectos": [
      { "id": "uuid", "nombre": "Proyecto Alpha", "rol": "SEEKER" }
    ]
  }
}
```

**400 — Validación:**
```json
{ "error": "email y password son requeridos" }
```

**401 — Credenciales inválidas:**
```json
{ "error": "Credenciales inválidas" }
```

**403 — Usuario inactivo:**
```json
{ "error": "Usuario inactivo. Contactá al administrador." }
```

**500 — Error interno:**
```json
{ "error": "internal server error" }
```

**Validaciones:**
- email: formato válido, requerido
- password: requerido, no vacío

---

### POST /auth/logout

> Invalida el refresh token del usuario activo.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Body:**
```json
{
  "refresh_token": "string"
}
```

**200 — Éxito:**
```json
{ "message": "Sesión cerrada correctamente" }
```

**401 — Token inválido:**
```json
{ "error": "Token inválido o expirado" }
```

---

### POST /auth/refresh-token

> Genera un nuevo access_token usando un refresh token válido.

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "refresh_token": "string"
}
```

**200 — Éxito:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "expires_in": 3600
}
```

**401 — Token inválido o expirado:**
```json
{ "error": "Refresh token inválido o expirado" }
```

---

### POST /auth/solicitar-reset

> Envía email con link para resetear contraseña.

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "email": "string"
}
```

**200 — Éxito (siempre, para no revelar si el email existe):**
```json
{ "message": "Si el email existe, recibirás instrucciones en breve." }
```

**400 — Validación:**
```json
{ "error": "email es requerido" }
```

---

### POST /auth/confirmar-reset

> Confirma el reset de contraseña con el token recibido por email.

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "token": "string — token recibido por email",
  "nueva_password": "string",
  "confirmar_password": "string"
}
```

**200 — Éxito:**
```json
{ "message": "Contraseña actualizada correctamente" }
```

**400 — Validación:**
```json
{ "error": "Las contraseñas no coinciden" }
```

**410 — Token expirado o inválido:**
```json
{ "error": "El link de recuperación expiró o es inválido" }
```

**Validaciones:**
- token: requerido
- nueva_password: mínimo 8 caracteres, requerido
- confirmar_password: debe coincidir con nueva_password

---

## TIME ENTRIES

---

### GET /time-entries

> Retorna registros de horas según rol del usuario autenticado.  
> Seeker: solo sus propias entradas. Gestor: entradas de su equipo. Admin: todas.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query params:**
| Param | Tipo | Requerido | Default | Descripción |
|-------|------|-----------|---------|-------------|
| semana_inicio | string | No | — | Filtro por inicio de semana (lunes), ISO `YYYY-MM-DD` |
| estado | string | No | — | PENDIENTE, APROBADO, APROBADO_CON_OBSERVACION, RECHAZADO (filtra por `time_entry_approvals.status`) |
| usuario_id | uuid | No | — | Solo Admin/Gestor |
| proyecto_id | uuid | No | — | Filtrar por proyecto |
| page | integer | No | 1 | Paginación |
| limit | integer | No | 20 | Máximo 100 |

**200 — Éxito:**
```json
{
  "data": [
    {
      "id": "uuid",
      "semana_inicio": "2026-05-18",
      "semana_fin": "2026-05-24",
      "fecha_carga": "2026-04-23T14:30:00Z",
      "usuario": {
        "id": "uuid",
        "nombres": "Juan",
        "apellidos": "Pérez"
      },
      "lineas": [
        {
          "id": "uuid",
          "proyecto": { "id": "uuid", "nombre": "Proyecto Alpha", "codigo": "PRJ-001", "manager_id": "uuid" },
          "categoria_ingreso": null,
          "horas": 8,
          "horas_extra": 0,
          "horas_efectivas": 8,
          "horas_extra_efectivas": 0,
          "comentario": "",
          "estado": "PENDIENTE",
          "es_mia": false
        }
      ],
      "total_horas": 8,
      "total_extras": 0,
      "aprobaciones": [
        {
          "id": "uuid",
          "accion": "APROBADO_CON_OBSERVACION",
          "linea_id": "uuid",
          "comentario": "Revisar las horas del martes",
          "sugerencia_horas": 6,
          "sugerencia_extras": null,
          "realizado_por": { "id": "uuid", "nombres": "María", "apellidos": "López" },
          "fecha": "2026-04-22T10:00:00Z"
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

**401 — Sin token:**
```json
{ "error": "Token requerido" }
```

---

### POST /time-entries

> Crea un nuevo registro de horas para la semana indicada.  
> Seeker y Gestor cargan para sí mismos. Toda carga nace en PENDIENTE — no hay auto-aprobación (ni siquiera para el gestor en su propio proyecto).

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Body:**
```json
{
  "semana_inicio": "2026-05-18",
  "semana_fin": "2026-05-24",
  "lineas": [
    {
      "proyecto_id": "uuid",
      "categoria_ingreso_id": "uuid — null si el proyecto no es tipo Area",
      "horas": 8,
      "horas_extra": 0,
      "comentario": "string — opcional, max 500 chars"
    }
  ]
}
```

**201 — Éxito:**
```json
{
  "id": "uuid",
  "usuario_id": "uuid",
  "semana_inicio": "2026-05-18",
  "semana_fin": "2026-05-24",
  "estado": "PENDIENTE",
  "fecha_carga": "2026-04-23T14:30:00Z",
  "lineas": [
    {
      "id": "uuid",
      "proyecto_id": "uuid",
      "categoria_ingreso_id": null,
      "horas": 8,
      "horas_extra": 0,
      "comentario": ""
    }
  ],
  "total_horas": 8,
  "total_extras": 0
}
```

**400 — Validación:**
```json
{ "error": "horas debe ser entre 0 y 24" }
```

**400 — Proyectos duplicados:**
```json
{ "error": "No se puede repetir el mismo proyecto en una carga" }
```

**400 — Semana ya cargada:**
```json
{ "error": "Ya existe una carga activa (PENDIENTE) para la semana 2026-05-18 al 2026-05-24 en ese proyecto" }
```

**403 — Proyecto no asignado:**
```json
{ "error": "No tenés acceso al proyecto indicado" }
```

**422 — Categoría requerida:**
```json
{ "error": "El proyecto 'Area' requiere una categoría de ingreso" }
```

**Validaciones:**
- semana: formato "S\d{2}/\d{2}", requerido
- lineas: array no vacío, requerido
- lineas[].proyecto_id: uuid válido, asignado al usuario, único en el array, requerido
- lineas[].horas: entero 0-24, requerido
- lineas[].horas_extra: entero 0-8, opcional (default 0)
- lineas[].comentario: max 500 chars, optional
- lineas[].categoria_ingreso_id: requerido solo si el proyecto es tipo "Area"

**Notas de implementación:**
- Si el usuario autenticado es Gestor y carga para sí mismo → estado = APROBADO automáticamente
- Seeker → estado = PENDIENTE
- Verificar que el usuario está asignado al proyecto antes de aceptar la carga

---

### GET /time-entries/:id

> Retorna el detalle completo de un registro de horas.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Path params:**
| Param | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| id | uuid | ✓ | ID del time entry |

**200 — Éxito:** (misma estructura que item en GET /time-entries)

**403 — Sin acceso:**
```json
{ "error": "No tenés permiso para ver este registro" }
```

**404 — No encontrado:**
```json
{ "error": "Registro no encontrado" }
```

---

### POST /time-entries/:id/approve

> Aprueba una **línea** (no toda la entrada) cuya aprobación está en PENDIENTE. Solo Gestor del proyecto o Admin.
> Acción definitiva — no reversible. El estado vive en `time_entry_approvals` (una fila por línea).

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Path params:**
| Param | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| id | uuid | ✓ | ID del time entry (entrada semanal) |

**Body:**
```json
{
  "linea_id": "uuid",
  "proyecto_id": "uuid"
}
```

**200 — Éxito:**
```json
{
  "id": "uuid",
  "proyecto_id": "uuid",
  "linea_id": "uuid",
  "estado": "APROBADO",
  "aprobado_en": "2026-04-24T10:00:00Z"
}
```

**403 — Estado inválido:**
```json
{ "error": "La línea indicada no está pendiente de aprobación" }
```

**403 — Sin permiso:**
```json
{ "error": "Solo el gestor del proyecto o un administrador puede aprobar" }
```

**404 — No encontrado:**
```json
{ "error": "Registro no encontrado" }
```
```json
{ "error": "No se encontró la línea indicada en este registro" }
```

**Validaciones:**
- linea_id: uuid de una línea de la entrada, requerido
- proyecto_id: uuid del proyecto de esa línea, requerido

**Notas de implementación:**
- Verifica que el usuario autenticado es Gestor asignado al proyecto, o Admin
- Enviar email de notificación al Seeker al aprobar

---

### POST /time-entries/:id/observe

> Aprueba una línea **con observación** (`APROBADO_CON_OBSERVACION`), con comentario y horas sugeridas. Las horas sugeridas se guardan en `suggested_hours`/`suggested_extra_hours`; las horas cargadas por el seeker no se modifican.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Path params:**
| Param | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| id | uuid | ✓ | ID del time entry (entrada semanal) |

**Body:**
```json
{
  "linea_id": "uuid",
  "proyecto_id": "uuid",
  "comentario_observacion": "Las horas del martes no cuadran con el cronograma",
  "sugerencia_horas": 6,
  "sugerencia_extras": 0
}
```

**200 — Éxito:**
```json
{
  "id": "uuid",
  "proyecto_id": "uuid",
  "linea_id": "uuid",
  "estado": "APROBADO_CON_OBSERVACION",
  "aprobado_en": "2026-04-24T10:00:00Z",
  "comentario_observacion": "Las horas del martes no cuadran con el cronograma"
}
```

**400 — Validación:**
```json
{ "error": "El comentario es requerido" }
```

**403 — Estado inválido:**
```json
{ "error": "La línea indicada no está pendiente de aprobación" }
```

**403 — Sin permiso:**
```json
{ "error": "Solo el gestor del proyecto o un administrador puede aprobar" }
```

**Validaciones:**
- linea_id, proyecto_id: uuid, requeridos
- comentario_observacion: requerido (mín. 1 carácter)
- sugerencia_horas: número ≥ 0, múltiplo de 0.5, requerido
- sugerencia_extras: número 0-8, múltiplo de 0.5, opcional

**Notas de implementación:**
- Enviar email de notificación al Seeker con el comentario y sugerencias

---

### POST /time-entries/:id/reject

> Rechaza definitivamente una línea. Estado final — no editable. El seeker puede re-cargar el proyecto (nueva línea PENDIENTE); la rechazada queda como histórico.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Path params:**
| Param | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| id | uuid | ✓ | ID del time entry (entrada semanal) |

**Body:**
```json
{
  "linea_id": "uuid",
  "proyecto_id": "uuid",
  "razon_rechazo": "Las horas no corresponden a ninguna tarea del sprint"
}
```

**200 — Éxito:**
```json
{
  "id": "uuid",
  "proyecto_id": "uuid",
  "linea_id": "uuid",
  "estado": "RECHAZADO",
  "rechazado_en": "2026-04-24T10:00:00Z",
  "razon_rechazo": "Las horas no corresponden a ninguna tarea del sprint"
}
```

**400 — Validación:**
```json
{ "error": "La razón de rechazo es requerida" }
```

**403 — Estado inválido:**
```json
{ "error": "La línea indicada no está pendiente de rechazo" }
```

**403 — Sin permiso:**
```json
{ "error": "Solo el gestor del proyecto o un administrador puede rechazar" }
```

**Validaciones:**
- linea_id, proyecto_id: uuid, requeridos
- razon_rechazo: requerido (mín. 1 carácter)

**Notas de implementación:**
- Enviar email de notificación al Seeker con la razón del rechazo

---

## USUARIOS

---

### GET /users

> Listado de usuarios del sistema. Solo Admin.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query params:**
| Param | Tipo | Requerido | Default | Descripción |
|-------|------|-----------|---------|-------------|
| activo | boolean | No | — | Filtrar por estado activo/inactivo |
| grupo | string | No | — | SEEKERS, GESTORES, ADMINISTRADORES |
| search | string | No | — | Búsqueda por nombre, apellido o email |
| equipo_id | uuid | No | — | Filtrar por equipo |
| page | integer | No | 1 | Paginación |
| limit | integer | No | 20 | Máximo 100 |

**200 — Éxito:**
```json
{
  "data": [
    {
      "id": "uuid",
      "email": "juan@seekglobal.co",
      "nombres": "Juan",
      "apellidos": "Pérez",
      "numero_documento": "12345678",
      "puesto": "Software Developer",
      "celular": "+5165432100",
      "avatar_url": "https://...",
      "activo": true,
      "staff": false,
      "super_usuario": false,
      "equipo": { "id": "uuid", "nombre": "Tech" },
      "area": { "id": "uuid", "nombre": "Desarrollo" },
      "grupos": ["SEEKERS"],
      "fecha_ingreso": "2023-03-15",
      "creado_en": "2023-03-15T10:30:00Z",
      "actualizado_en": "2026-04-22T14:15:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 87,
    "pages": 5
  }
}
```

**403 — Sin permiso:**
```json
{ "error": "Solo administradores pueden ver el listado de usuarios" }
```

---

### POST /users

> Crea un nuevo usuario en el sistema. Solo Admin.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Body:**
```json
{
  "email": "nuevo@seekglobal.co",
  "nombres": "Carlos",
  "apellidos": "González",
  "numero_documento": "87654321",
  "puesto": "Project Manager",
  "celular": "+5198765432",
  "avatar_url": null,
  "equipo_id": "uuid",
  "area_id": "uuid",
  "fecha_ingreso": "2026-04-24",
  "activo": true,
  "staff": false,
  "super_usuario": false,
  "grupos": ["SEEKERS"]
}
```

**201 — Éxito:**
```json
{
  "id": "uuid",
  "email": "nuevo@seekglobal.co",
  "nombres": "Carlos",
  "apellidos": "González",
  "activo": true,
  "creado_en": "2026-04-24T12:00:00Z"
}
```

**400 — Validación:**
```json
{ "error": "El email ya está registrado en el sistema" }
```

**400 — Documento duplicado:**
```json
{ "error": "El número de documento ya está registrado" }
```

**Validaciones:**
- email: formato válido, único, requerido
- nombres: max 100 chars, requerido
- apellidos: max 100 chars, requerido
- numero_documento: 6-20 dígitos, único, requerido
- puesto: max 100 chars, requerido
- celular: formato +[país][número], opcional
- equipo_id: uuid válido existente, requerido
- area_id: uuid válido existente, requerido
- fecha_ingreso: no puede ser futura, requerido
- grupos: array con al menos un grupo válido, requerido

**Notas de implementación:**
- Enviar email de bienvenida con link para crear contraseña
- La contraseña la define el usuario en su primer acceso (flujo de reset)

---

### GET /users/:id

> Retorna detalle completo de un usuario incluyendo proyectos asignados.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Path params:**
| Param | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| id | uuid | ✓ | ID del usuario |

**200 — Éxito:**
```json
{
  "id": "uuid",
  "email": "juan@seekglobal.co",
  "nombres": "Juan",
  "apellidos": "Pérez",
  "numero_documento": "12345678",
  "puesto": "Software Developer",
  "celular": "+5165432100",
  "avatar_url": null,
  "activo": true,
  "staff": false,
  "super_usuario": false,
  "equipo": { "id": "uuid", "nombre": "Tech" },
  "area": { "id": "uuid", "nombre": "Desarrollo" },
  "grupos": ["SEEKERS"],
  "fecha_ingreso": "2023-03-15",
  "proyectos": [
    {
      "id": "uuid",
      "nombre": "Proyecto Alpha",
      "codigo": "PRJ-001",
      "cliente": "Cliente S.A.",
      "rol": "SEEKER",
      "activo": true
    }
  ],
  "creado_en": "2023-03-15T10:30:00Z",
  "actualizado_en": "2026-04-22T14:15:00Z",
  "desactivado_en": null
}
```

**403 — Sin permiso:**
```json
{ "error": "Solo administradores pueden ver el detalle de usuarios" }
```

**404 — No encontrado:**
```json
{ "error": "Usuario no encontrado" }
```

---

### PUT /users/:id

> Actualiza los datos de un usuario. Email no es editable. Solo Admin.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Path params:**
| Param | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| id | uuid | ✓ | ID del usuario |

**Body:** (todos los campos son opcionales excepto los requeridos del modelo)
```json
{
  "nombres": "Juan Carlos",
  "apellidos": "Pérez Quispe",
  "numero_documento": "12345678",
  "puesto": "Senior Developer",
  "celular": "+5165432100",
  "avatar_url": null,
  "equipo_id": "uuid",
  "area_id": "uuid",
  "fecha_ingreso": "2023-03-15",
  "activo": true,
  "staff": false,
  "super_usuario": false,
  "grupos": ["SEEKERS", "GESTORES"]
}
```

**200 — Éxito:**
```json
{
  "id": "uuid",
  "nombres": "Juan Carlos",
  "apellidos": "Pérez Quispe",
  "actualizado_en": "2026-04-24T12:00:00Z"
}
```

**400 — Validación:**
```json
{ "error": "numero_documento ya está en uso por otro usuario" }
```

**404 — No encontrado:**
```json
{ "error": "Usuario no encontrado" }
```

**Validaciones:** (mismas que POST, excepto email que es inmutable)

---

### PATCH /users/:id/toggle-activo

> Activa o desactiva un usuario (soft delete). Solo Admin.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Path params:**
| Param | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| id | uuid | ✓ | ID del usuario |

**200 — Éxito:**
```json
{
  "id": "uuid",
  "activo": false,
  "desactivado_en": "2026-04-24T12:00:00Z"
}
```

**403 — Sin permiso:**
```json
{ "error": "Solo administradores pueden activar/desactivar usuarios" }
```

**404 — No encontrado:**
```json
{ "error": "Usuario no encontrado" }
```

---

## CLIENTES

---

### GET /clients

> Listado de clientes. Solo Admin.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query params:**
| Param | Tipo | Requerido | Default | Descripción |
|-------|------|-----------|---------|-------------|
| activo | boolean | No | — | Filtrar activos/inactivos |
| search | string | No | — | Búsqueda por nombre o RUC |
| segmentacion_id | uuid | No | — | Filtrar por segmentación |
| page | integer | No | 1 | Paginación |
| limit | integer | No | 20 | Máximo 100 |

**200 — Éxito:**
```json
{
  "data": [
    {
      "id": "uuid",
      "nombre": "Empresa ABC",
      "razon_social": "Empresa ABC S.A.C.",
      "razon_comercial": "ABC Solutions",
      "ruc": "20123456789",
      "nombre_contacto": "Pedro Ramos",
      "email_contacto": "pedro@empresaabc.com",
      "telefono": "+5112345678",
      "direccion": "Av. Principal 123, Lima",
      "categoria_usuario": { "id": "uuid", "nombre": "Corporativo" },
      "segmentacion": { "id": "uuid", "nombre": "Enterprise" },
      "sector": { "id": "uuid", "nombre": "Tecnología" },
      "activo": true,
      "proyectos_count": 3,
      "creado_en": "2024-01-10T08:00:00Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 12, "pages": 1 }
}
```

---

### POST /clients

> Crea un nuevo cliente. Solo Admin.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Body:**
```json
{
  "nombre": "Empresa ABC",
  "razon_social": "Empresa ABC S.A.C.",
  "razon_comercial": "ABC Solutions",
  "ruc": "20123456789",
  "nombre_contacto": "Pedro Ramos",
  "email_contacto": "pedro@empresaabc.com",
  "telefono": "+5112345678",
  "direccion": "Av. Principal 123, Lima",
  "categoria_usuario_id": "uuid",
  "segmentacion_id": "uuid",
  "sector_id": "uuid",
  "activo": true
}
```

**201 — Éxito:**
```json
{
  "id": "uuid",
  "nombre": "Empresa ABC",
  "ruc": "20123456789",
  "activo": true,
  "creado_en": "2026-04-24T12:00:00Z"
}
```

**400 — RUC duplicado:**
```json
{ "error": "El RUC ya está registrado en otro cliente" }
```

**Validaciones:**
- nombre: max 100, requerido
- ruc: 11-14 dígitos, único, requerido
- razon_social: max 150, opcional
- razon_comercial: max 150, opcional
- email_contacto: formato válido, opcional
- categoria_usuario_id: uuid existente, requerido
- segmentacion_id: uuid existente, requerido
- sector_id: uuid existente, opcional

---

### GET /clients/:id

> Detalle de un cliente con sus proyectos asociados.

**Headers:**
```
Authorization: Bearer <access_token>
```

**200 — Éxito:**
```json
{
  "id": "uuid",
  "nombre": "Empresa ABC",
  "razon_social": "Empresa ABC S.A.C.",
  "razon_comercial": "ABC Solutions",
  "ruc": "20123456789",
  "nombre_contacto": "Pedro Ramos",
  "email_contacto": "pedro@empresaabc.com",
  "telefono": "+5112345678",
  "direccion": "Av. Principal 123, Lima",
  "categoria_usuario": { "id": "uuid", "nombre": "Corporativo" },
  "segmentacion": { "id": "uuid", "nombre": "Enterprise" },
  "sector": { "id": "uuid", "nombre": "Tecnología" },
  "activo": true,
  "proyectos": [
    { "id": "uuid", "nombre": "Proyecto Alpha", "codigo": "PRJ-001", "activo": true }
  ],
  "creado_en": "2024-01-10T08:00:00Z",
  "actualizado_en": "2026-04-10T10:00:00Z"
}
```

**404 — No encontrado:**
```json
{ "error": "Cliente no encontrado" }
```

---

### PUT /clients/:id

> Actualiza los datos de un cliente. Solo Admin.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Body:** (mismos campos que POST, todos opcionales)

**200 — Éxito:**
```json
{
  "id": "uuid",
  "nombre": "Empresa ABC Actualizada",
  "actualizado_en": "2026-04-24T12:00:00Z"
}
```

**400 — Validación:**
```json
{ "error": "El RUC ya está en uso por otro cliente" }
```

**404 — No encontrado:**
```json
{ "error": "Cliente no encontrado" }
```

---

### PATCH /clients/:id/toggle-activo

> Activa o desactiva un cliente. Solo Admin.

**Headers:**
```
Authorization: Bearer <access_token>
```

**200 — Éxito:**
```json
{
  "id": "uuid",
  "activo": false,
  "actualizado_en": "2026-04-24T12:00:00Z"
}
```

---

## PROYECTOS

---

### GET /projects

> Listado de proyectos. Admin: todos. Gestor/Seeker: solo los asignados.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query params:**
| Param | Tipo | Requerido | Default | Descripción |
|-------|------|-----------|---------|-------------|
| activo | boolean | No | — | Filtrar por estado |
| cliente_id | uuid | No | — | Filtrar por cliente |
| gestor_id | uuid | No | — | Filtrar por gestor |
| search | string | No | — | Búsqueda por nombre o código |
| page | integer | No | 1 | Paginación |
| limit | integer | No | 20 | Máximo 100 |

**200 — Éxito:**
```json
{
  "data": [
    {
      "id": "uuid",
      "codigo": "PRJ-001",
      "nombre": "Proyecto Alpha",
      "descripcion": "Descripción del proyecto",
      "cliente": { "id": "uuid", "nombre": "Empresa ABC" },
      "gestor": { "id": "uuid", "nombres": "María", "apellidos": "López" },
      "segmentacion": { "id": "uuid", "nombre": "Enterprise" },
      "categoria_ingreso": { "id": "uuid", "nombre": "Consultoría" },
      "tipo_servicio": { "id": "uuid", "nombre": "Desarrollo" },
      "fecha_inicio": "2024-01-15",
      "fecha_fin": "2024-12-31",
      "activo": true,
      "usuarios_count": 5
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 8, "pages": 1 }
}
```

---

### POST /projects

> Crea un nuevo proyecto. Solo Admin.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Body:**
```json
{
  "codigo": "PRJ-002",
  "nombre": "Proyecto Beta",
  "cliente_id": "uuid",
  "descripcion": "Descripción del proyecto",
  "segmentacion_id": "uuid",
  "categoria_ingreso_id": "uuid",
  "capa_productividad_id": null,
  "tipo_servicio_id": "uuid",
  "gestor_id": "uuid",
  "fecha_inicio": "2026-05-01",
  "fecha_fin": "2026-12-31",
  "activo": true
}
```

**201 — Éxito:**
```json
{
  "id": "uuid",
  "codigo": "PRJ-002",
  "nombre": "Proyecto Beta",
  "activo": true,
  "creado_en": "2026-04-24T12:00:00Z"
}
```

**400 — Código duplicado:**
```json
{ "error": "El código de proyecto ya existe" }
```

**400 — Fechas inválidas:**
```json
{ "error": "fecha_fin no puede ser anterior a fecha_inicio" }
```

**400 — Gestor inválido:**
```json
{ "error": "El gestor indicado no tiene rol de Gestor activo" }
```

**Validaciones:**
- codigo: alfanumérico + guiones, max 20, único, requerido
- nombre: max 100, requerido
- cliente_id: uuid cliente activo, requerido
- gestor_id: uuid usuario activo con rol GESTOR, requerido
- segmentacion_id: uuid existente, requerido
- categoria_ingreso_id: uuid existente, requerido
- fecha_fin: no puede ser < fecha_inicio (si ambas presentes)

---

### GET /projects/:id

> Detalle de un proyecto con usuarios asignados.

**Headers:**
```
Authorization: Bearer <access_token>
```

**200 — Éxito:**
```json
{
  "id": "uuid",
  "codigo": "PRJ-001",
  "nombre": "Proyecto Alpha",
  "descripcion": "Descripción del proyecto",
  "cliente": { "id": "uuid", "nombre": "Empresa ABC", "ruc": "20123456789" },
  "gestor": { "id": "uuid", "nombres": "María", "apellidos": "López" },
  "segmentacion": { "id": "uuid", "nombre": "Enterprise" },
  "categoria_ingreso": { "id": "uuid", "nombre": "Consultoría" },
  "tipo_servicio": { "id": "uuid", "nombre": "Desarrollo" },
  "capa_productividad": null,
  "fecha_inicio": "2024-01-15",
  "fecha_fin": "2024-12-31",
  "activo": true,
  "usuarios": [
    {
      "id": "uuid",
      "nombres": "Juan",
      "apellidos": "Pérez",
      "email": "juan@seekglobal.co",
      "rol": "SEEKER",
      "avatar_url": null
    }
  ],
  "creado_en": "2024-01-10T08:00:00Z",
  "actualizado_en": "2026-04-10T10:00:00Z"
}
```

**403 — Sin acceso:**
```json
{ "error": "No tenés acceso a este proyecto" }
```

**404 — No encontrado:**
```json
{ "error": "Proyecto no encontrado" }
```

---

### PUT /projects/:id

> Actualiza los datos de un proyecto. Solo Admin.

**Body:** (mismos campos que POST, todos opcionales)

**200 — Éxito:**
```json
{
  "id": "uuid",
  "nombre": "Proyecto Alpha Actualizado",
  "actualizado_en": "2026-04-24T12:00:00Z"
}
```

---

### PATCH /projects/:id/toggle-activo

> Activa o desactiva un proyecto. Solo Admin.

**200 — Éxito:**
```json
{
  "id": "uuid",
  "activo": false,
  "actualizado_en": "2026-04-24T12:00:00Z"
}
```

---

### POST /projects/:id/usuarios

> Asigna uno o más usuarios a un proyecto con rol específico. Solo Admin.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Body:**
```json
{
  "usuarios": [
    { "usuario_id": "uuid", "rol": "SEEKER" },
    { "usuario_id": "uuid", "rol": "GESTOR" }
  ]
}
```

**200 — Éxito:**
```json
{
  "proyecto_id": "uuid",
  "usuarios_asignados": [
    { "usuario_id": "uuid", "rol": "SEEKER" }
  ],
  "ya_existian": []
}
```

**400 — Usuario ya asignado:**
```json
{ "error": "El usuario ya está asignado a este proyecto con ese rol" }
```

**400 — Rol inválido:**
```json
{ "error": "rol debe ser SEEKER o GESTOR" }
```

**Validaciones:**
- usuarios: array no vacío, requerido
- usuarios[].usuario_id: uuid de usuario activo, requerido
- usuarios[].rol: SEEKER o GESTOR, requerido

---

### DELETE /projects/:id/usuarios/:usuario_id

> Desasigna un usuario de un proyecto. Solo Admin.

**Headers:**
```
Authorization: Bearer <access_token>
```

**200 — Éxito:**
```json
{ "message": "Usuario desasignado correctamente" }
```

**404 — No encontrado:**
```json
{ "error": "El usuario no está asignado a este proyecto" }
```

---

## CONFIG (Tablas de Lookup)

> Todos los endpoints de config son GET, requieren autenticación, y retornan listas estáticas.

---

### GET /config/equipos

**200:**
```json
[
  { "id": "uuid", "nombre": "Tech", "activo": true },
  { "id": "uuid", "nombre": "Diseño", "activo": true }
]
```

---

### GET /config/areas

**200:**
```json
[
  { "id": "uuid", "nombre": "Desarrollo", "activo": true },
  { "id": "uuid", "nombre": "Producto", "activo": true }
]
```

---

### GET /config/grupos

**200:**
```json
[
  { "id": "uuid", "codigo": "SEEKERS", "nombre": "Seekers" },
  { "id": "uuid", "codigo": "GESTORES", "nombre": "Gestores" },
  { "id": "uuid", "codigo": "ADMINISTRADORES", "nombre": "Administradores" }
]
```

---

### GET /config/categorias-proyecto

> Categorías de proyecto. Las que tienen `esDeArea: true` son las categorías de área usadas en las líneas de horas de proyectos de tipo área (consolidación de `income_categories`, 2026-05-22).

**200:**
```json
[
  { "id": "uuid", "nombre": "Reclutamiento", "activo": true, "esDeArea": true },
  { "id": "uuid", "nombre": "Capacitación", "activo": true, "esDeArea": true },
  { "id": "uuid", "nombre": "Consultoría", "activo": true, "esDeArea": false }
]
```

---

### GET /config/segmentaciones

**200:**
```json
[
  { "id": "uuid", "nombre": "Enterprise", "activo": true },
  { "id": "uuid", "nombre": "Mid Market", "activo": true },
  { "id": "uuid", "nombre": "SMB", "activo": true }
]
```

---

### GET /config/sectores

**200:**
```json
[
  { "id": "uuid", "nombre": "Tecnología", "activo": true },
  { "id": "uuid", "nombre": "Finanzas", "activo": true },
  { "id": "uuid", "nombre": "Retail", "activo": true }
]
```

---

### GET /config/tipos-servicio

**200:**
```json
[
  { "id": "uuid", "nombre": "Consultoría", "activo": true },
  { "id": "uuid", "nombre": "Desarrollo", "activo": true },
  { "id": "uuid", "nombre": "Soporte", "activo": true }
]
```

---

## Convenciones Globales

### Autenticación
- Todos los endpoints protegidos requieren: `Authorization: Bearer <jwt_token>`
- JWT expira en 1 hora. Usar `/auth/refresh-token` para renovar.
- El payload del JWT incluye: `{ usuario_id, roles, proyectos_ids }`

### Errores Estándar
| Código | Significado |
|--------|-------------|
| 400 | Validación de input — mensaje específico |
| 401 | Token ausente, inválido o expirado |
| 403 | Sin permiso para la acción (autenticado pero sin autorización) |
| 404 | Recurso no encontrado |
| 409 | Conflicto (duplicado) |
| 422 | Entidad no procesable (regla de negocio) |
| 500 | Error interno — loguear en servidor |

### Paginación
```json
{
  "data": [...],
  "pagination": { "page": 1, "limit": 20, "total": 100, "pages": 5 }
}
```

### Soft Delete
- users, clients, projects usan `activo: false` — nunca se eliminan físicamente
- Los endpoints GET excluyen inactivos por defecto salvo que se pase `activo=false`

### Auditoría
- Todos los recursos incluyen `creado_en`, `actualizado_en` (ISO 8601 UTC)
- time_entries incluyen historial completo en el array `aprobaciones`
