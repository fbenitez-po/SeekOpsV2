# Epic 03 — Admin: Gestión de Sistema

---

## US-009: Crear usuario

### Historia de usuario

Como Admin, quiero crear nuevos usuarios en el sistema, para onboardear empleados.

### Criterios de aceptación

- **Given** estoy en el backoffice **When** hago clic en "Usuarios" → "Crear usuario" **Then** se abre formulario con: nombre, email, documento, puesto, equipo, área, fecha de ingreso, grupos/roles (selección múltiple: Seeker, Gestor, Admin)

- **Given** he completado el formulario **When** hago clic en "Crear" **Then** el usuario se crea (sin contraseña) y recibe un email de bienvenida con un link para establecer su contraseña (válido 48 horas)

- **Given** el usuario recibió el email **When** hace clic en el link **Then** se abre la pantalla "Activar cuenta" donde puede establecer su contraseña por primera vez

- **Given** el usuario estableció su contraseña **When** hace clic en "Activar cuenta" **Then** la contraseña queda guardada y es redirigido al login para ingresar normalmente

- **Given** el link de activación expiró (>48 horas) **When** el usuario intenta usarlo **Then** ve mensaje "El link expiró. Pedí al administrador que reenvíe la invitación"

- **Given** creé un usuario **When** visualizo el listado **Then** aparece el nuevo usuario con estado "Activo"

- **Given** creé un usuario **When** asigno proyectos **Then** puedo asignarle rol específico por proyecto (puede ser Seeker en uno y Gestor en otro)

### Supuestos y riesgos

- El usuario NO tiene contraseña hasta que active su cuenta via el link del email
- El link de activación usa el mismo mecanismo que reset de contraseña (tabla `password_reset_tokens`), válido 48 horas
- Si el link expiró, el admin puede reenviar la invitación (funcionalidad futura — por ahora el admin recrea el usuario o usa el flujo de reset)
- Un usuario puede ser Seeker, Gestor, o Admin (rol principal), pero sus roles en cada proyecto se definen al asignar
- El email se envía usando SMTP configurado en variables de entorno (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS)
- En entorno de desarrollo sin SMTP configurado, el link se imprime en consola

### Estado

✅ Lista para desarrollo

---

## US-010: Crear cliente

### Historia de usuario

Como Admin, quiero registrar nuevos clientes en el sistema, para poder asignarles proyectos.

### Criterios de aceptación

- **Given** estoy en el backoffice **When** hago clic en "Clientes" → "Crear cliente" **Then** se abre formulario con: nombre, descripción, estado (Activo/Inactivo)

- **Given** he completado el formulario **When** hago clic en "Crear" **Then** el cliente se crea y aparece en listado

- **Given** creé un cliente **When** creo un proyecto **Then** puedo asignarle este cliente

- **Given** un cliente está "Inactivo" **When** intento usarlo en un nuevo proyecto **Then** el sistema lo permite pero muestra advertencia

### Supuestos y riesgos

- Los clientes no se eliminan, solo se desactivan
- Un cliente inactivo no aparece en nuevos proyectos por defecto, pero se puede forzar

### Estado

✅ Lista para desarrollo

---

## US-011: Crear proyecto

### Historia de usuario

Como Admin, quiero crear nuevos proyectos, para poder asignar empleados a trabajar en ellos.

### Criterios de aceptación

- **Given** estoy en el backoffice **When** hago clic en "Proyectos" → "Crear proyecto" **Then** se abre formulario con: nombre, cliente (dropdown), descripción, estado (Activo/Inactivo)

- **Given** he completado el formulario **When** hago clic en "Crear" **Then** el proyecto se crea y aparece en listado

- **Given** creé un proyecto **When** asigno usuarios **Then** puedo definir rol de cada usuario (Seeker o Gestor) en ese proyecto específico

- **Given** un proyecto está "Inactivo" **When** intento asignar usuarios **Then** el sistema lo permite pero muestra advertencia

### Supuestos y riesgos

- Los proyectos no se eliminan, solo se desactivan
- Un proyecto requiere obligatoriamente un cliente asignado
- Los usuarios no ven proyectos inactivos en su listado

### Estado

✅ Lista para desarrollo

---

## US-012: Asignar usuarios a proyectos con rol

### Historia de usuario

Como Admin, quiero asignar usuarios a proyectos con roles específicos (Seeker o Gestor), para que puedan registrar y/o aprobar horas.

### Criterios de aceptación

- **Given** estoy editando un proyecto **When** hago clic en "Asignar usuarios" **Then** veo lista de usuarios disponibles con selector de rol (Seeker/Gestor) por usuario

- **Given** he seleccionado usuarios y roles **When** hago clic en "Guardar asignaciones" **Then** los usuarios se asignan y aparecen en el proyecto con su rol

- **Given** asigné un usuario como Gestor **When** ese usuario entra **Then** ve las horas pendientes de aprobación de su equipo en ese proyecto

- **Given** asigné un usuario como Seeker **When** ese usuario entra **Then** ve ese proyecto en su lista para cargar horas

- **Given** un usuario es Seeker Y Gestor en el mismo proyecto **When** carga horas y luego las revisa como gestor **Then** puede auto-aprobarlas

- **Given** desasigno un usuario **When** ese usuario entra **Then** ya no ve ese proyecto en su lista

### Supuestos y riesgos

- Un usuario puede tener múltiples roles en múltiples proyectos
- Un usuario puede ser simultáneamente Seeker y Gestor del mismo proyecto
- Cambios en asignaciones son inmediatos (no requieren que el usuario recargue)

### Estado

✅ Lista para desarrollo

---

## US-013: Editar usuario

### Historia de usuario

Como Admin, quiero editar los datos de un usuario, cambiar su rol, o darlo de baja, para mantener la información actualizada y gestionar accesos.

### Criterios de aceptación

- **Given** estoy en listado de usuarios **When** hago clic en un usuario **Then** se abre detalle/form con: nombre, email, grupos/roles, estado (Activo/Inactivo)

- **Given** estoy editando un usuario **When** cambio datos y hago clic en "Guardar" **Then** los datos se actualizan

- **Given** estoy editando grupos/roles **When** selecciono uno o más roles (Seeker, Gestor, Admin) mediante botones toggle **Then** el usuario queda con todos los roles seleccionados simultáneamente

- **Given** cambio los roles de un usuario **When** hago clic en "Guardar" **Then** los roles se actualizan y el usuario ve las secciones correspondientes en su home (un Seeker+Gestor ve ambas vistas)

- **Given** quiero dar de baja un usuario **When** cambio estado a "Inactivo" **Then** el usuario no puede loguearse más, pero su historial de horas se mantiene

- **Given** reactivo un usuario inactivo **When** cambio estado a "Activo" **Then** puede volver a loguearse

### Supuestos y riesgos

- Dar de baja es un soft delete (no se elimina, solo se marca inactivo)
- Las horas histórico se mantienen intactas
- No se pueden eliminar usuarios con horas sin aprobar (aclaración: sí se pueden dar de baja, pero las horas quedan "sin gestor")

### Estado

✅ Lista para desarrollo

---

## US-014: Editar cliente

### Historia de usuario

Como Admin, quiero editar los datos de un cliente o darlo de baja, para mantener el directorio actualizado.

### Criterios de aceptación

- **Given** estoy en listado de clientes **When** hago clic en un cliente **Then** se abre detalle/form con: nombre, descripción, estado (Activo/Inactivo)

- **Given** estoy editando un cliente **When** cambio datos y hago clic en "Guardar" **Then** los datos se actualizan

- **Given** quiero dar de baja un cliente **When** cambio estado a "Inactivo" **Then** no puedo asignarle nuevos proyectos, pero sus proyectos existentes se mantienen

- **Given** reactivo un cliente **When** cambio estado a "Activo" **Then** puedo volver a usarlo en nuevos proyectos

### Supuestos y riesgos

- Dar de baja es soft delete
- Proyectos asociados quedan intactos pero con cliente "inactivo"

### Estado

✅ Lista para desarrollo

---

## US-015: Editar proyecto

### Historia de usuario

Como Admin, quiero editar los datos de un proyecto, cambiar usuario asignados, o darlo de baja, para mantener proyectos actualizados.

### Criterios de aceptación

- **Given** estoy en listado de proyectos **When** hago clic en un proyecto **Then** se abre detalle/form con: nombre, cliente, descripción, estado (Activo/Inactivo), usuarios asignados

- **Given** estoy editando un proyecto **When** cambio datos y hago clic en "Guardar" **Then** los datos se actualizan

- **Given** quiero reasignar usuarios **When** hago clic en "Editar usuarios" **Then** veo listado con checkboxes y selectores de rol (como en US-012)

- **Given** desasigno un usuario **When** guardo cambios **Then** ese usuario ya no ve el proyecto en su home, pero su histórico de horas se mantiene

- **Given** quiero dar de baja un proyecto **When** cambio estado a "Inactivo" **Then** los usuarios no ven el proyecto en su listado, pero el histórico se mantiene

- **Given** reactivo un proyecto **When** cambio estado a "Activo" **Then** usuarios ven el proyecto de nuevo

### Supuestos y riesgos

- Dar de baja es soft delete
- Histórico de horas se mantiene intacto
- Usuarios activos que trabajaban en el proyecto solo dejan de verlo si es inactivo

### Estado

✅ Lista para desarrollo

---

## US-016: Administración de accesos y roles

### Historia de usuario

Como Admin, quiero gestionar permisos y roles de manera granular, para controlar quién puede hacer qué en el sistema.

### Criterios de aceptación

- **Given** estoy en la sección de "Permisos" (Backoffice) **When** accedo **Then** veo 3 roles base: Seeker, Gestor, Admin, con sus permisos listados

- **Given** veo permisos de un rol **When** reviso **Then** veo qué acciones pueden hacer: ver horas, cargar horas, aprobar, etc.

- **Given** quiero modificar permisos **When** cambio un permiso para un rol **Then** se actualiza inmediatamente para todos los usuarios con ese rol

- **Given** creo un usuario **When** le asigno rol **Then** hereda todos los permisos del rol automáticamente

- **Given** un usuario tiene múltiples roles **When** intenta una acción **Then** puede si CUALQUIERA de sus roles tiene permiso

### Supuestos y riesgos

- En V1, 3 roles fijos (Seeker, Gestor, Admin) — no crear roles custom
- Los permisos son predefinidos, no es 100% granular pero sí flexible
- Los cambios de permiso aplican a nuevas sesiones (sesiones activas mantienen permisos anteriores)

### Estado

✅ Lista para desarrollo
