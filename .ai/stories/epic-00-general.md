# Epic 00 — General: Funcionalidades Transversales

---

## US-100: Login

### Historia de usuario

Como usuario (Seeker, Gestor o Admin), quiero ingresar al sistema con mi email y contraseña, para acceder a mis funcionalidades según mi rol.

### Criterios de aceptación

- **Given** estoy en la pantalla de login **When** ingreso email y contraseña válidos **Then** se autentica y redirige a Home según mi rol

- **Given** estoy en login **When** ingreso credenciales incorrectas **Then** muestra error: "Email o contraseña inválidos" (sin especificar cuál)

- **Given** estoy en login **When** intento enviar sin completar campos **Then** valida campos requeridos y muestra error por campo

- **Given** estoy logueado **When** navego a otra pestaña y presiono atrás **Then** no puedo volver a login (sesión activa)

- **Given** estoy logueado **When** hago clic en "Cerrar sesión" **Then** se cierra sesión y vuelvo a login

### Supuestos y riesgos

- JWT para sesión (definido en stack)
- Contraseña se envía hasheada
- Session timeout después de X minutos (definir en código)

### Estado

✅ Lista para desarrollo

---

## US-101: Reset/Recuperar Contraseña

### Historia de usuario

Como usuario, quiero recuperar mi contraseña si la olvidé, para poder volver a ingresar al sistema.

### Criterios de aceptación

- **Given** estoy en login **When** hago clic en "¿Olvidaste tu contraseña?" **Then** me redirige a pantalla de recuperación

- **Given** estoy en recuperación **When** ingreso mi email **Then** valido que exista en el sistema

- **Given** el email existe **When** hago clic en "Enviar link" **Then** se envía email con link de reset (válido 24 horas)

- **Given** recibí el email **When** hago clic en el link **Then** se abre pantalla para ingresar nueva contraseña

- **Given** estoy ingresando nueva contraseña **When** completo y hago clic en "Guardar" **Then** contraseña se actualiza y me redirige a login

- **Given** el link expiró **When** intento usarlo **Then** muestro error: "Link expirado. Solicita uno nuevo"

### Supuestos y riesgos

- Email debe estar configurado (SMTP)
- Link único por recuperación
- No permitir reusar contraseña anterior

### Estado

✅ Lista para desarrollo

---

## US-102: Home Seeker

### Historia de usuario

Como Seeker, quiero ver mi home con un resumen completo de mi estado de horas, para saber rápidamente qué acciones tengo pendientes y cargar nuevas horas.

### Criterios de aceptación

**Sección 1: Semanas Pendientes de Carga**
- **Given** soy Seeker y tengo semanas sin cargar **When** entro al home **Then** veo badges con "S15/24", "S16/24", etc. (semanas pendientes)
- **Given** hago clic en un badge de semana pendiente **Then** se desplaza a la sección de carga y pre-selecciona esa semana

**Sección 2: Horas Observadas o con Accionables**
- **Given** tengo horas observadas **When** estoy en home **Then** veo: "Requieren tu atención:" + listado de cargas observadas (Proyecto - Semana) con botón [Ajustar]
- **Given** hago clic en [Ajustar] **Then** me redirige a S-01-AJUSTAR-HORAS para modificar esa carga
- **Given** no tengo cargas observadas **Then** muestro "Ninguna" (gris, con ícono checkmark)

**Sección 3: Histórico Últimas 3 Semanas**
- **Given** tengo carga registradas **When** veo el histórico **Then** muestro las últimas 3 semanas con estado (S14/24 - 40h ✓ Aprobado | S13/24 - 35h 🔍 Observado | etc)
- **Given** hago clic en una línea del histórico **Then** puedo ver detalles de esa carga (modal opcional)

**Sección 4: Acciones Rápidas**
- **Given** estoy en home **When** veo la sección de acciones rápidas **Then** hay botón "[+ Cargar nuevas horas]"
- **Given** hago clic en [+ Cargar nuevas horas] **When** desde home **Then** me redirige a S-01-CARGAR-HORAS

### Supuestos y riesgos

- El resumen (secciones 1-3) debe refrescarse al entrar a home
- Botón navega a pantalla dedicada S-01-CARGAR-HORAS donde está el formulario completo
- Home solo muestra resumen y navegación, no formulario de carga

### Estado

✅ Lista para desarrollo

---

## US-103: Home Gestor

### Historia de usuario

Como Gestor, quiero ver mi home con horas pendientes de mi equipo y mis propias horas (si soy Seeker), para gestionar aprobaciones y cargar mis horas.

### Criterios de aceptación

**Sección 1: Horas Pendientes de Aprobación (Mi Equipo)**
- **Given** soy Gestor y me logueo **When** entro al home **Then** veo título "Horas de tu equipo pendientes de aprobación"
- **Given** tengo horas pendientes de mi equipo **When** estoy en home **Then** veo tabla con columnas: Seeker | Proyecto | Semana | Horas | Acciones
- **Given** veo horas pendientes **When** quiero gestionarlas **Then** tengo botones: [Aprobar] | [Observar] | [Rechazar]
- **Given** hago clic [Aprobar] **When** en una carga **Then** abre modal de confirmación, y si confirmo → aprueba y refresca tabla
- **Given** hago clic [Observar] **When** en una carga **Then** me redirige a S-02-OBSERVACION (formulario de observación)
- **Given** hago clic [Rechazar] **When** en una carga **Then** me redirige a S-02-RECHAZO (formulario de rechazo)
- **Given** veo la tabla **When** hay filtros disponibles **Then** puedo filtrar por: Proyecto (multi), Seeker (multi), [Limpiar]
- **Given** filtro activo **When** hago clic [Limpiar] **Then** limpia filtros y recarga tabla
- **Given** tengo horas pendientes **When** veo paginación **Then** muestra "Página X de Y" con max 10 registros/página
- **Given** estoy en home **When** veo totales **Then** muestra "Pendientes: XXh | Total buscado: YYh"
- **Given** no tengo horas pendientes **When** estoy en home **Then** muestro "No hay horas pendientes de aprobación"
- **Given** no tengo horas pendientes **When** veo botón [+ CARGAR MIS HORAS] **Then** el botón sigue visible (puede cargar las suyas)

**Sección 2: Mis Horas Pendientes (si soy Seeker también)**
- **Given** soy Gestor Y Seeker **When** tengo horas propias pendientes **Then** veo sección: "Tienes horas pendientes de aprobación en otros proyectos donde eres Seeker"
- **Given** veo mis horas pendientes **When** estoy en sección 2 **Then** muestro tabla similar (sin columna Seeker): Proyecto | Semana | Horas | Estado | Acciones
- **Given** veo mis horas observadas **When** están en sección 2 **Then** puedo hacer clic [Ajustar] → S-01-AJUSTAR-HORAS
- **Given** veo botón [Ver más] **When** hay varias horas **Then** expande listado completo
- **Given** no tengo horas propias pendientes **When** estoy en home **Then** sección 2 muestra "Ninguna"
- **Given** no tengo rol Seeker **When** estoy en home **Then** no muestro sección 2

### Supuestos y riesgos

- Badge de "X horas pendientes" visible en navegación/header
- Tabla debe refrescarse al entrar (mínimo) o en tiempo real si es posible
- Gestor sin rol Seeker solo ve sección 1

### Estado

✅ Lista para desarrollo

---

## US-104: Home Admin

### Historia de usuario

Como Admin, quiero ver mi home con un resumen del sistema (usuarios, clientes, proyectos, horas pendientes) y acceso a funciones críticas, para monitorear y gestionar la plataforma.

### Criterios de aceptación

**Sección 1: Métricas Clave (4 Cards)**
- **Given** soy Admin y me logueo **When** entro al home **Then** veo 4 cards: Usuarios Activos (nro) | Clientes Activos (nro) | Proyectos Activos (nro) | Horas Pendientes (nro)
- **Given** veo una card **When** hago clic **Then** navego: Usuarios→S-03-USUARIOS-LISTA | Clientes→S-03-CLIENTES-LISTA | Proyectos→S-03-PROYECTOS-LISTA | Horas Pendientes→Scroll a sección 3

**Sección 2: Acciones Rápidas**
- **Given** estoy en home **When** veo acciones rápidas **Then** hay 3 botones: [+ Nuevo Usuario] | [+ Nuevo Cliente] | [+ Nuevo Proyecto]
- **Given** hago clic en cualquier botón **When** desde home **Then** navego: Usuario→S-03-USUARIO-CREAR | Cliente→S-03-CLIENTE-CREAR | Proyecto→S-03-PROYECTO-CREAR

**Sección 3: Horas Pendientes Global**
- **Given** soy Admin **When** estoy en home **Then** veo tabla "Horas de todos los proyectos pendientes de aprobación"
- **Given** veo filtros **When** quiero filtrar **Then** hay dropdowns: Proyecto (multi) | Gestor (multi) | Seeker (multi) + [Limpiar]
- **Given** veo la tabla **When** miro columnas **Then** muestro: Seeker | Proyecto | Semana | Horas | Gestor | Acciones
- **Given** hago clic [→] en una fila **When** quiero actuar **Then** abre modal con opciones: [Aprobar] | [Observar] | [Rechazar]
- **Given** veo paginación **When** hay muchas cargas **Then** máx 10/página, "Página X de Y", botones [< >]
- **Given** estoy en tabla **When** veo totales **Then** muestra "Pendientes: XXh | Total buscado: YYh"

**Sección 4: Alertas/Pendientes**
- **Given** soy Admin **When** estoy en home **Then** veo alertas si hay:
  - ⚠️ "N usuarios sin completar información de trabajo"
  - ⚠️ "N clientes inactivos (últimas 30 días sin movimiento)"
  - ⚠️ "N proyectos con fecha de fin vencida"
  - ⚠️ "N horas rechazadas sin resolución"
- **Given** hago clic en una alerta **When** quiero investigar **Then** navego a listado con filtro pre-aplicado

### Supuestos y riesgos

- Admin puede tener rol Seeker o Gestor también, pero home prioriza funciones Admin
- Métricas deben actualizarse al entrar a home
- Tabla de horas es GLOBAL (todos los proyectos/equipos)

### Estado

✅ Lista para desarrollo
