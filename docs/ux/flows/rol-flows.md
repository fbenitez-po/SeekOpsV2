# Flujos UX — Seekops

> User flows completos por rol: happy path, alternativos y fricciones.
> Basado en User Story Maps validados.

---

## F-01 — Seeker: Autenticación y acceso

**Rol:** Seeker  
**Prioridad:** Alta  
**Relacionado con:** US-00-001, US-00-002

### Happy path

```
Usuario inicia sesión
  ↓
Ingresa credenciales (correo + contraseña)
  ↓
Sistema valida credenciales
  ↓
Credenciales válidas → Redirige a Hogar Seeker
```

### Flujos alternativos

**Si credenciales son inválidas:**
```
Sistema muestra advertencia "Credenciales inválidas"
  ↓
Usuario puede:
  - Reintentar con credenciales correctas
  - Hacer clic en "Recuperar contraseña" → Flujo F-01-ALT
```

**Recuperar contraseña (F-01-ALT):**
```
Usuario hace clic en "¿Olvidaste tu contraseña?"
  ↓
Sistema solicita correo
  ↓
Sistema envía enlace de recuperación
  ↓
Usuario restablece contraseña
  ↓
Puede volver a intentar login
```

### Fricciones / Puntos de decisión

- **¿Mostrar contraseña?** → Checkbox "Mostrar contraseña" en campo
- **¿Recordar sesión?** → No (JWT con timeout definido en código, sin "Remember me")
- **¿Validar en tiempo real?** → Validar solo al hacer submit

### Pantallas involucradas

- `S-00-LOGIN` — Pantalla de login
- `S-00-RECUPERAR-CONTRASEÑA` — Recuperación de contraseña

---

## F-02 — Seeker: Cargar horas semanales

**Rol:** Seeker  
**Prioridad:** Alta  
**Relacionado con:** US-01-001, US-01-002

### Happy path

```
Seeker accede a Hogar
  ↓
Ve lista de proyectos asignados + semanas disponibles
  ↓
Hace clic en "Cargar horas" o "+ Nueva carga"
  ↓
Abre formulario de carga con campos:
  - Semana (selector)
  - Proyecto (selector, solo proyectos asignados)
  - Categoría (selector, opcional)
  - Horas (número)
  - Horas extra (número, opcional)
  - Comentario (texto libre, opcional)
  ↓
Completa campos y valida
  ↓
Hace clic en "Cargar"
  ↓
Sistema procesa carga
  ↓
Carga exitosa → Muestra confirmación + regresa a historial
```

### Flujos alternativos

**Si ya existe una carga para esa semana/proyecto:**
```
Sistema permite editar la existente en lugar de crear nueva
  ↓
Mostrar "Editar" en lugar de "Cargar"
  ↓
Seeker actualiza valores
  ↓
Sistema guarda cambios
```

**Si faltan campos obligatorios:**
```
Sistema marca campos con error visual
  ↓
Muestra mensaje "Completa todos los campos obligatorios"
  ↓
Usuario completa y reintenta
```

**Si Horas Extra está marcado:**
```
Campo "Horas Extra" solo visible si se completa "Horas"
  ↓
Sistema valida que Horas + Horas Extra no superen máximo permitido (si aplica)
```

### Fricciones / Puntos de decisión

- **¿Puede cargar horas retroactivas?** → Sí, sin límite (decisión ya tomada)
- **¿Qué sucede si el seeker intenta cargar fuera de su proyecto?** → Dropdown solo muestra proyectos asignados
- **¿Hay límite de horas por semana?** → No para MVP; puede regularizarse post-MVP
- **¿Categoría es obligatoria?** → No (opcional)
- **¿Mostrar horas semanales totales en tiempo real?** → Sí, debajo del formulario

### Pantallas involucradas

- `S-01-HOME-SEEKER` — Hogar/Historial Seeker
- `S-01-CARGAR-HORAS` — Formulario de carga de horas
- `S-01-CONFIRMACION-CARGA` — Confirmación de carga exitosa

---

## F-03 — Seeker: Ajustar horas observadas

**Rol:** Seeker  
**Prioridad:** Alta  
**Relacionado con:** US-01-003

### Happy path

```
Seeker ve en historial una entrada con estado "OBSERVADO"
  ↓
Hace clic en "Ajustar" o ícono de edición
  ↓
Sistema abre formulario de ajuste con:
  - Semana (bloqueada, solo lectura)
  - Proyecto (bloqueada, solo lectura)
  - Horas (editable)
  - Horas extra (editable)
  - Comentario (editable, opcional)
  - Motivo de observación original (mostrado como referencia)
  ↓
Seeker corrige valores
  ↓
Hace clic en "Guardar ajuste"
  ↓
Sistema procesa ajuste
  ↓
Ajuste exitoso → Estado cambia a "AJUSTADO" + notificación
```

### Flujos alternativos

**Si el seeker rechaza hacer el ajuste:**
```
Puede cerrar el formulario sin guardar
  ↓
La entrada sigue en estado "OBSERVADO"
  ↓
Seeker puede revisarla más tarde
```

**Si el gestor hace una nueva observación:**
```
El estado anterior "AJUSTADO" se reemplaza por "OBSERVADO" nuevamente
  ↓
Seeker ve la nueva observación
```

### Fricciones / Puntos de decisión

- **¿Mostrar quién hizo la observación?** → Sí (nombre del gestor + fecha)
- **¿Permitir múltiples ajustes?** → Sí, tantos como sea necesario
- **¿Notificar al gestor cuando se ajusta?** → Sí (email automático)

### Pantallas involucradas

- `S-01-HOME-SEEKER` — Historial con estado "OBSERVADO"
- `S-01-AJUSTAR-HORAS` — Formulario de ajuste
- `S-01-CONFIRMACION-AJUSTE` — Confirmación de ajuste

---

## F-04 — Seeker: Ver historial y filtros

**Rol:** Seeker  
**Prioridad:** Media  
**Relacionado con:** US-01-002

### Happy path

```
Seeker accede a "Mis horas" o Hogar
  ↓
Ve tabla de historial con columnas:
  - Semana
  - Proyecto
  - Categoría
  - Horas
  - Horas extra
  - Estado (PENDIENTE, APROBADO, OBSERVADO, RECHAZADO)
  - Acciones (Ver, Ajustar, si aplica)
  ↓
Puede filtrar por:
  - Proyecto (multi-select)
  - Estado (multi-select)
  - Rango de fechas (opcional)
  ↓
Tabla se actualiza en tiempo real
```

### Flujos alternativos

**Si no hay cargas:**
```
Mostrar estado vacío con mensaje "No hay registros de horas"
  ↓
Botón "Cargar mis primeras horas" → Flujo F-02
```

### Fricciones / Puntos de decisión

- **¿Ordenable por columnas?** → Sí, por defecto por semana descendente
- **¿Paginación o scroll infinito?** → Paginación (20 registros por página)
- **¿Mostrar totales?** → Sí, al pie: "Total de horas: XX | Total extra: YY"

### Pantallas involucradas

- `S-01-HOME-SEEKER` — Historial completo

---

## F-05 — Gestor: Autenticación y acceso

**Rol:** Gestor  
**Prioridad:** Alta  
**Relacionado con:** US-00-001, US-00-003

### Happy path

```
Usuario (con rol Gestor) inicia sesión
  ↓
Ingresa credenciales (correo + contraseña)
  ↓
Sistema valida credenciales
  ↓
Credenciales válidas → Redirige a Hogar Gestor
```

### Flujos alternativos

**Mismo que Seeker (F-01)** — compartir lógica de autenticación

### Pantallas involucradas

- `S-00-LOGIN` — Pantalla de login (compartida)

---

## F-06 — Gestor: Ver horas pendientes y aprobar/observar/rechazar

**Rol:** Gestor  
**Prioridad:** Alta  
**Relacionado con:** US-02-001, US-02-002, US-02-003, US-02-004

### Happy path - Aprobar

```
Gestor accede a Hogar
  ↓
Ve tabla de horas pendientes de aprobación con columnas:
  - Seeker (nombre)
  - Semana
  - Proyecto
  - Horas
  - Horas extra
  - Estado (PENDIENTE)
  - Acciones (Aprobar, Observar, Rechazar)
  ↓
Puede filtrar por proyecto, seeker, estado
  ↓
Hace clic en "Aprobar"
  ↓
Sistema solicita confirmación
  ↓
Gestor confirma
  ↓
Sistema marca como APROBADO
  ↓
Email enviado a Seeker: "Tus horas han sido aprobadas"
  ↓
Entrada desaparece de lista "PENDIENTE"
```

### Flujos alternativos

**Hacer observación:**
```
Gestor hace clic en "Observar"
  ↓
Sistema abre modal/formulario con campo:
  - Motivo de observación (textarea, obligatorio)
  - Opciones predefinidas (ej. "Falta documentación", "Revisar cantidad", etc.)
  ↓
Gestor ingresa motivo
  ↓
Hace clic en "Guardar"
  ↓
Sistema cambia estado a OBSERVADO
  ↓
Email enviado a Seeker: "Horas observadas" + motivo
  ↓
Seeker puede ahora hacer ajustes (Flujo F-03)
```

**Rechazar:**
```
Gestor hace clic en "Rechazar"
  ↓
Sistema abre modal con campo:
  - Motivo de rechazo (textarea, obligatorio)
  - Opciones predefinidas (ej. "Proyecto cerrado", "Datos incorrectos", etc.)
  ↓
Gestor ingresa motivo
  ↓
Hace clic en "Guardar"
  ↓
Sistema cambia estado a RECHAZADO
  ↓
Email enviado a Seeker: "Horas rechazadas" + motivo
  ↓
Entrada se marca como RECHAZADO (no editable)
  ↓
Seeker debe cargar nuevas horas si lo requiere
```

### Fricciones / Puntos de decisión

- **¿Puede deshacer una aprobación?** → No (decisión: aprobación no reversible)
- **¿Notificaciones en tiempo real?** → Email; considerar notificación en-app post-MVP
- **¿Puede aprobar/observar/rechazar sus propias horas?** → Sí (auto-aprobación permitida)
- **¿Mostrar cantidad de pendientes?** → Sí, en badge en nav o dashboard

### Pantallas involucradas

- `S-02-HOME-GESTOR` — Hogar Gestor con pendientes
- `S-02-OBSERVACION` — Modal/formulario de observación
- `S-02-RECHAZO` — Modal/formulario de rechazo
- `S-02-CONFIRMACION` — Confirmación de aprobación

---

## F-07 — Gestor: Cargar horas propias

**Rol:** Gestor (cuando es también Seeker en su proyecto)  
**Prioridad:** Media  
**Relacionado con:** US-02-005

### Happy path

```
Gestor accede a sección "Cargar mis horas"
  ↓
Sistema abre formulario igual a Seeker (Flujo F-02)
  ↓
Gestor completa datos
  ↓
Hace clic en "Cargar"
  ↓
Sistema procesa carga
  ↓
Carga exitosa → Se marca como APROBADO automáticamente (auto-aprobación)
  ↓
Confirma al gestor que sus horas fueron registradas
```

### Fricciones / Puntos de decisión

- **¿Requiere auto-aprobación?** → Sí (decisión: gestor puede auto-aprobar)
- **¿Aparece en su propio historial como "APROBADO"?** → Sí
- **¿Puede el admin veto esta aprobación?** → Sí (post-MVP o en regularización)

### Pantallas involucradas

- `S-02-CARGAR-HORAS-GESTOR` — Formulario (similar a Seeker)

---

## F-08 — Admin: Autenticación y acceso

**Rol:** Admin  
**Prioridad:** Alta  
**Relacionado con:** US-00-001

### Happy path

```
Usuario (con rol Admin) inicia sesión
  ↓
Ingresa credenciales
  ↓
Sistema valida → Redirige a Hogar Admin
```

### Flujos alternativos

**Mismo que Seeker/Gestor** — compartir autenticación

---

## F-09 — Admin: Gestión de usuarios (CRUD)

**Rol:** Admin  
**Prioridad:** Alta  
**Relacionado con:** US-03-001, US-03-002, US-03-005

### Happy path - Crear usuario

```
Admin accede a "Usuarios"
  ↓
Ve tabla de usuarios existentes
  ↓
Hace clic en "+ Crear usuario"
  ↓
Sistema abre formulario con campos:
  - Nombre completo (texto, obligatorio)
  - Correo (email, obligatorio, único)
  - Rol inicial (selector: Seeker, Gestor, Admin)
  - Estado (Activo/Inactivo)
  ↓
Admin completa datos
  ↓
Hace clic en "Guardar"
  ↓
Sistema valida correo único
  ↓
Crea usuario + genera contraseña temporal
  ↓
Email enviado a usuario: "Tu cuenta ha sido creada" + contraseña temporal + link para cambiar contraseña
  ↓
Usuario aparece en lista con estado INACTIVO hasta que hace login
```

### Flujos alternativos - Editar usuario

```
Admin hace clic en usuario en la tabla
  ↓
Sistema abre formulario con datos existentes
  ↓
Admin puede editar:
  - Nombre
  - Rol(es) — multi-select para proyectos
  - Estado (Activo/Inactivo)
  ↓
Hace clic en "Guardar cambios"
  ↓
Sistema valida y actualiza
  ↓
Si cambió rol/proyecto → Email a usuario notificando cambios
```

**Desactivar usuario:**
```
Admin hace clic en "Desactivar" o cambia estado a "Inactivo"
  ↓
Sistema marca usuario como INACTIVO
  ↓
Usuario no puede hacer login (soft delete, no eliminado)
  ↓
Sus horas históricas se mantienen
```

### Fricciones / Puntos de decisión

- **¿Contraseña inicial aleatoria o preguntada?** → Aleatoria generada + email
- **¿Puede admin asignar roles post-creación?** → Sí, en edición
- **¿Eliminar o soft delete?** → Soft delete (decisión: usuarios inactivos, no eliminados)
- **¿Puede haber múltiples admins?** → Sí
- **¿Auditoría de cambios?** → Sí (quién cambió qué y cuándo)

### Pantallas involucradas

- `S-03-HOME-ADMIN` — Hogar Admin
- `S-03-USUARIOS-LISTA` — Tabla de usuarios
- `S-03-USUARIO-CREAR` — Formulario de creación
- `S-03-USUARIO-EDITAR` — Formulario de edición

---

## F-10 — Admin: Gestión de clientes (CRUD)

**Rol:** Admin  
**Prioridad:** Alta  
**Relacionado con:** US-03-003, US-03-006

### Happy path - Crear cliente

```
Admin accede a "Clientes"
  ↓
Ve tabla de clientes existentes
  ↓
Hace clic en "+ Crear cliente"
  ↓
Sistema abre formulario:
  - Nombre cliente (texto, obligatorio)
  - Contacto (correo, opcional)
  - Dirección (opcional)
  - Estado (Activo/Inactivo)
  ↓
Admin completa datos
  ↓
Hace clic en "Guardar"
  ↓
Cliente creado + aparece en lista
```

### Flujos alternativos - Editar cliente

```
Admin hace clic en cliente
  ↓
Sistema abre formulario con datos
  ↓
Admin edita campos
  ↓
Hace clic en "Guardar cambios"
  ↓
Sistema actualiza cliente
```

**Desactivar cliente:**
```
Admin cambia estado a "Inactivo"
  ↓
Cliente no aparece en dropdowns de carga
  ↓
Proyectos asociados siguen existiendo pero inactivos
```

### Fricciones / Puntos de decisión

- **¿Contacto es obligatorio?** → No (opcional)
- **¿Puede haber cliente sin proyectos?** → Sí
- **¿Soft delete?** → Sí (Inactivo, no eliminado)

### Pantallas involucradas

- `S-03-CLIENTES-LISTA` — Tabla de clientes
- `S-03-CLIENTE-CREAR` — Formulario de creación
- `S-03-CLIENTE-EDITAR` — Formulario de edición

---

## F-11 — Admin: Gestión de proyectos (CRUD) y asignación de usuarios

**Rol:** Admin  
**Prioridad:** Alta  
**Relacionado con:** US-03-004, US-03-007

### Happy path - Crear proyecto

```
Admin accede a "Proyectos"
  ↓
Ve tabla de proyectos existentes
  ↓
Hace clic en "+ Crear proyecto"
  ↓
Sistema abre formulario:
  - Nombre proyecto (texto, obligatorio)
  - Cliente (selector, obligatorio)
  - Descripción (textarea, opcional)
  - Estado (Activo/Inactivo)
  ↓
Admin completa datos
  ↓
Hace clic en "Guardar"
  ↓
Proyecto creado
  ↓
Sistema sugiere "Asignar usuarios a este proyecto" → Flujo F-11-ALT
```

### Flujos alternativos - Editar proyecto

```
Admin hace clic en proyecto
  ↓
Sistema abre formulario con datos
  ↓
Admin edita nombre, cliente, descripción, estado
  ↓
Hace clic en "Guardar cambios"
```

**Asignar usuarios:**
```
Admin hace clic en proyecto → "Asignar usuarios" o "+ Agregar"
  ↓
Sistema abre modal con:
  - Lista de usuarios disponibles (Seeker y Gestor)
  - Selector de rol para cada usuario (Seeker, Gestor)
  - Checkbox multi-select para agregar
  ↓
Admin selecciona usuarios y asigna roles
  ↓
Hace clic en "Guardar asignaciones"
  ↓
Sistema vincula usuarios al proyecto
  ↓
Email a usuarios asignados: "Has sido asignado al proyecto X con rol Y"
  ↓
Usuarios ven proyecto en su dropdown de carga
```

**Cambiar rol de usuario en proyecto:**
```
Admin ve tabla de usuarios asignados al proyecto
  ↓
Hace clic en usuario → "Cambiar rol"
  ↓
Selector abre con opción Seeker/Gestor
  ↓
Admin selecciona nuevo rol
  ↓
Hace clic en "Guardar"
  ↓
Email a usuario notificando cambio de rol
```

### Fricciones / Puntos de decisión

- **¿Un usuario puede tener múltiples roles en un proyecto?** → No, un rol por proyecto (Seeker O Gestor, no ambos en el mismo)
- **¿Pero puede ser Seeker en A y Gestor en B?** → Sí (decisión: múltiples roles en múltiples proyectos)
- **¿Quién aprueba si proyecto sin gestor asignado?** → Admin (por defecto)
- **¿Notificar a usuario cuando se desasigna?** → Sí, email

### Pantallas involucradas

- `S-03-PROYECTOS-LISTA` — Tabla de proyectos
- `S-03-PROYECTO-CREAR` — Formulario de creación
- `S-03-PROYECTO-EDITAR` — Formulario de edición
- `S-03-PROYECTO-ASIGNAR-USUARIOS` — Modal de asignación

---

## F-12 — Admin: Ver, aprobar, observar, rechazar horas (como Gestor global)

**Rol:** Admin  
**Prioridad:** Alta  
**Relacionado con:** US-03-008

### Happy path

```
Admin accede a "Todas las horas" o "Aprobaciones"
  ↓
Ve tabla de todas las cargas del sistema con:
  - Seeker
  - Proyecto
  - Semana
  - Horas
  - Estado (PENDIENTE, APROBADO, OBSERVADO, RECHAZADO)
  - Gestor asignado (si existe)
  ↓
Puede filtrar por:
  - Proyecto (multi-select)
  - Seeker (multi-select)
  - Gestor (multi-select)
  - Estado (multi-select)
  - Rango de fechas
  ↓
Hace clic en una entrada PENDIENTE
  ↓
Sistema abre detalles + acciones (Aprobar, Observar, Rechazar)
  ↓
Admin elige acción → Mismo flujo que Gestor (F-06)
  ↓
Sistema procesa cambio
  ↓
Email a seeker + a gestor (si existe) notificando decisión
```

### Flujos alternativos

**Si proyecto tiene gestor asignado:**
```
Admin ve entrada en estado PENDIENTE
  ↓
Puede elegir si:
  - Dejar que el gestor la apruebe
  - Aprobar admin directamente (override)
```

**Regularización post-MVP:**
```
Admin puede ver y regularizar horas de seekers dados de baja
  ↓
Calcular finiquitos, reportes, etc.
```

### Fricciones / Puntos de decisión

- **¿Puede admin override la decisión de un gestor?** → Sí (post-MVP definir si permite desaprobar)
- **¿Mostrar auditoría de cambios?** → Sí, quién aprobó/observó/rechazó y cuándo

### Pantallas involucradas

- `S-03-TODAS-LAS-HORAS` — Tabla global de horas
- `S-03-DETALLES-HORA` — Detalles de una carga

---

## Notas generales

### Decisiones confirmadas en flujos

1. **Autenticación compartida:** Los 3 roles usan mismo login (F-01)
2. **Aprobación no reversible:** Una vez aprobada, no se puede desaprobar (F-06)
3. **Auto-aprobación de Gestor:** Gestor aprueba sus propias horas automáticamente (F-07)
4. **Múltiples roles entre proyectos:** Seeker en A, Gestor en B es válido (F-11)
5. **Horas retroactivas:** Sin límite, cualquier semana (F-02)
6. **Soft delete:** Usuarios/clientes/proyectos inactivos, no eliminados (F-09, F-10, F-11)
7. **Auditoría completa:** Se registra quién cambió qué y cuándo (F-09 onwards)
8. **Notificaciones por email:** En cada cambio de estado (Aprobado, Observado, Rechazado, Asignación)

### Pantallas a especificar (próximo paso)

Total de **18 pantallas** a especificar con `/ux-screen-spec`:

**Generales:**
- S-00-LOGIN
- S-00-RECUPERAR-CONTRASEÑA

**Seeker:**
- S-01-HOME-SEEKER
- S-01-CARGAR-HORAS
- S-01-CONFIRMACION-CARGA
- S-01-AJUSTAR-HORAS
- S-01-CONFIRMACION-AJUSTE

**Gestor:**
- S-02-HOME-GESTOR
- S-02-OBSERVACION
- S-02-RECHAZO
- S-02-CONFIRMACION
- S-02-CARGAR-HORAS-GESTOR

**Admin:**
- S-03-HOME-ADMIN
- S-03-USUARIOS-LISTA
- S-03-USUARIO-CREAR
- S-03-USUARIO-EDITAR
- S-03-CLIENTES-LISTA
- S-03-CLIENTE-CREAR
- S-03-CLIENTE-EDITAR
- S-03-PROYECTOS-LISTA
- S-03-PROYECTO-CREAR
- S-03-PROYECTO-EDITAR
- S-03-PROYECTO-ASIGNAR-USUARIOS
- S-03-TODAS-LAS-HORAS
- S-03-DETALLES-HORA

---

