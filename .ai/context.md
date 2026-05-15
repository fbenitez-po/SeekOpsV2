# Contexto del proyecto — [Nombre del proyecto]

> Fuente de verdad del proyecto. Actualizar cada vez que se tome una decisión relevante.
> Este archivo es lo primero que lee Claude al inicio de cada sesión.

---

## Qué es este producto

Seekops es una plataforma web moderna para registro de horas trabajadas de empleados (seekers) en proyectos de clientes. Reemplaza una versión obsoleta con mejor UX/DX y stack tecnológico moderno. Objetivo: que los seekers carguen horas activamente sin recordatorios, con flujo de aprobación claro y gestión completa de usuarios, clientes y proyectos.

---

## Stack tecnológico

- **Frontend:** React (web)
- **Backend:** Node.js + Express
- **Base de datos:** PostgreSQL
- **Autenticación:** JWT
- **Deploy:** Por confirmar

---

## Público objetivo

- **Seeker** — Empleados de Seek que registran horas en proyectos asignados. Necesitan una interfaz simple para cargar horas semanales sin fricciones.
- **Gestor** — Líderes de proyecto que aprueban/observan horas del equipo asignado. Requieren visibilidad de estado de aprobaciones pendientes.
- **Administrador** — Gestiona usuarios, clientes y proyectos. Acceso backoffice completo y regularización de horas.

Escala: 50-200 usuarios activos. Idioma: Español.

---

## Flujo de trabajo del proyecto

Cada etapa requiere aprobación antes de avanzar a la siguiente:

```
Brief (completado)
  → Stories (completado)
  → UX flows (completado)
  → UX screens (completado)
  → Preview UX (completado)
  → Specification Summary (completado)
  → Resolver pendientes (completado)
  → DB (completado)
  → API + Mocks (completado)
  → Código (completado)
```

### Detalle de cada paso

- **Brief** `/pm-brief` — problema, solución, alcance MVP, entidades, flujos clave y stack. Requiere aprobación explícita antes de continuar.
- **Stories** `/pm-story` — historias por rol con criterios Given/When/Then. Solo avanzar cuando todas están en "lista para desarrollo" o los pendientes están documentados.
- **UX flows** `/ux-user-flow` — user flows con happy path, alternativos y fricciones. Validar con el cliente antes de ir a screens — cambiar un flujo es más barato que cambiar pantallas.
- **UX screens** `/ux-screen-spec` — especificación de cada pantalla con layout, estados, acciones y responsive. Una screen por archivo.
- **Preview UX** — HTML estático con identidad visual del cliente. Revisar con `/ux-design-review` antes de dar por aprobado.
- **Specification Summary** — consolidación centralizada de campos, validaciones, endpoints y estados. Une historias, flujos y pantallas en una referencia técnica única para Backend y Frontend. Genera automáticamente después de pantallas especificadas.
- **Resolver pendientes** — antes de tocar código, cerrar todos los ítems del `pendientes.md` que bloquean desarrollo (auth, email, validaciones, etc.). Pendientes sin resolver generan deuda técnica desde el día 1.
- **DB** `/db-schema-design` — schema PostgreSQL con DDL completo, índices justificados y seeds necesarios.
- **API + Mocks** `/be-api-contract` — contratos REST con request/response/errores por rol. Mocks JSON por endpoint para que frontend pueda avanzar en paralelo.
- **Código** — implementación sobre todo lo anterior ya validado.

Ver `WORKFLOW.md` para el checklist completo de cada etapa.

---

## Estado actual

- **Etapa:** Código (completado ✅) — Proyecto listo para ejecutar y testear
- **Completado:** 
  - 21 historias de usuario ✅
  - 12 flujos UX detallados ✅
  - 25 especificaciones de pantallas (.md) completadas y detalladas ✅
  - Campos y comportamientos definidos por pantalla ✅
  - 25+ previews HTML interactivos actualizados ✅
  - Índice central de navegación ✅
  - PostgreSQL schema completado (10 config + 4 core + 4 M2M + 6 transaccional + 5 finanzas + 2 comercial = 31 tablas) ✅
  - Architectural consistency: Home → Funcionalidad pattern applied to all roles ✅
- **Últimas actualizaciones (esta sesión):**
  - ✅ US-004 (nueva): Alerta de semanas sin carga en Home Seeker — muestra al ingresar las semanas desde `fecha_ingreso` hasta hoy que no tienen ninguna carga registrada. Permanente hasta que se carguen. Lógica en JS en el servicio para garantizar consistencia con el formato de semanas del frontend (`S15/26`).
  - ✅ Endpoint: `GET /time-entries/semanas-sin-carga` (solo requiere token, devuelve `{ semanas: [], total: N }`)
  - ✅ S-01-HOME-SEEKER: 4 secciones (pendientes, observadas, histórico) + button to S-01-CARGAR-HORAS
  - ✅ S-01-CARGAR-HORAS: Navegación semana, múltiples proyectos sin repetir, categoría condicional
  - ✅ S-02-HOME-GESTOR: Dashboard only (pendientes de equipo + mis pendientes) + button to S-02-CARGAR-HORAS-GESTOR
  - ✅ S-03-HOME-ADMIN: Dashboard only (métricas, acciones rápidas, horas pendientes global, alertas)
  - ✅ US-102 (Home Seeker): Updated to dashboard-only pattern
  - ✅ All homes now follow Home → Funcionalidad pattern (no complex forms in dashboards)
- **Bugs corregidos en testing (2026-04-24):**
  - ✅ `projectData.listarProyectos`: Gestor no veía sus proyectos en el combo — faltaba condición `OR p.gestor_id = usuario`
  - ✅ `timeEntryData.verificarProyectoAsignado`: Gestor no podía guardar horas en sus proyectos — misma causa, se agregó UNION con `projects WHERE gestor_id`
  - ✅ `timeEntryData.listarEntradas`: Panel del gestor mostraba 0 entradas — usaba `te.usuario_id` (columna inexistente), corregido a `te.user_id`
- **Documentación lista para desarrollo:**
  - ✅ `.ai/SPECIFICATION-SUMMARY.md` — Referencia técnica centralizada (campos, validaciones, endpoints)
  - ✅ Historias de usuario (Epic 00-03) con criterios de aceptación detallados
  - ✅ 25+ especificaciones de pantallas con layouts, validaciones, responsive
  - ✅ 25+ previews HTML interactivos (shadcn/ui + Tailwind)
  
- **Próximo paso:** 
  1. ✅ Schema PostgreSQL completado (`.ai/db/schema.md`) — 27 tablas, fuente de verdad: `setup_schema.sql` + `setup_seeds.sql`
  2. ✅ Migraciones SQL completadas (`.ai/db/migrations/`) — 19 migraciones (001–019), consolidadas en `setup_schema.sql`
  3. ✅ Specification Summary completado (`.ai/SPECIFICATION-SUMMARY.md`)
  4. ✅ Contratos REST completados (`.ai/api/contracts-rol.md`) — 35+ endpoints con request/response/errores/validaciones
  5. ✅ Mocks JSON completados (`.ai/api/mocks/`) — 6 archivos: auth, time-entries, users, clients, projects, config
  6. ✅ Backend implementado (Node.js + Express + PostgreSQL + JWT) — `backend/src/`
  7. ✅ Frontend implementado (React + Vite + shadcn/ui + Tailwind) — `frontend/src/`
  8. ✅ Dependencias instaladas en backend y frontend

---

## Entidades principales

- **User** — Seeker, Gestor, Admin; pueden tener múltiples roles en múltiples proyectos
- **Client** — Clientes para los que se trabaja; pueden estar Activos o Inactivos
- **Project** — Proyectos de clientes; tienen usuarios asignados con roles
- **TimeEntry** — Registro de horas semanales (semana, proyecto, categoría, horas, extras, estado)
- **TimeEntryApproval** — Historial de aprobaciones/observaciones/rechazos por TimeEntry

---

## Decisiones de arquitectura

- **Autenticación:** JWT (stateless)
- **Sesiones:** Timeout a definir en código
- **Soft delete:** Users, Clients, Projects (inactivos, no eliminados)
- **Auditoria:** Campo `updated_at` + logs de cambios en TimeEntry
- **Email:** SMTP integrado con nodemailer (`emailService.js`). Dos tipos de email: bienvenida (link activación 48h) y reset de contraseña (link 1h). Si SMTP no está configurado, el link se imprime en consola (dev mode).
- **Activación de cuenta:** Nuevos usuarios no tienen contraseña. Al crearlos, se genera un token (tabla `password_reset_tokens`, válido 48h) y se envía email de bienvenida con link a `/activar-cuenta?token=...`. El endpoint de activación reutiliza `POST /api/auth/confirmar-reset`.
- **Acceso a proyectos del Gestor:** Un Gestor tiene acceso a todos los proyectos donde figura como `gestor_id` en la tabla `projects`, independientemente de si tiene fila en `project_users`. Esta regla aplica en tres puntos del backend: listar proyectos disponibles, verificar acceso al guardar horas, y listar time entries del panel. Los tres puntos fueron corregidos en `projectData.js` y `timeEntryData.js` (2026-04-24).
- **Áreas de usuario (M2M):** El campo `area_id` fue eliminado de `users`. Reemplazado por tabla `user_areas` (M2M). Un usuario debe tener al menos un área (validado en aplicación y route). El selector en UI es del mismo estilo toggle que los grupos. Migración: `004_user_areas_project_area.sql` (2026-04-30).
- **Área de proyecto (opcional):** Los proyectos tienen un campo `area_id` nullable. En UI se controla con un checkbox "Este proyecto aplica a un área específica" que habilita un Select para elegir el área. Si el checkbox está desmarcado, se envía `null`. Misma migración `004`.
- **Proyecciones de horas:** Tabla `hour_projections` (migración 008). El gestor registra rangos de horas proyectadas para un usuario en un proyecto (fecha_inicio, fecha_fin, horas_proyectadas en NUMERIC 0.5). `categoria_id` es FK opcional a `client_categories`. Alertas en Home del Gestor. Endpoint: `GET /projections/alertas`.
- **Módulo Finanzas:** Tablas `periodos`, `ingresos`, `gastos_admin`, `costos_venta`, `costos_por_persona` (migraciones 014–018). Los períodos son mensuales con estado abierto/cerrado. Los ingresos se registran por (proyecto, período). Los costos por persona incluyen remuneración, días hábiles y horas por día.
- **Módulo Comercial:** Tablas `tipos_documento` y `registros_comerciales` (migración 019). Los registros comerciales vinculan propuestas/contratos a proyectos y responsables, con precio, moneda, tipo de documento y estado de facturación.
- **Clientes — campo nombre eliminado:** El campo `nombre` fue eliminado de `clients` (migración 012). `razon_social` es el identificador principal (NOT NULL). `client_category_id` pasó a ser nullable (migración 011).
- **Proyectos — descripcion eliminada:** El campo `descripcion` fue eliminado de `projects` (migración 013). Se agregaron `fecha_inicio_real` y `fecha_fin_real` para calcular desviaciones.

---

## Decisiones de UX

**12 flujos principales documentados** (ver `.ai/ux/flows/rol-flows.md`):

### Flujos Seeker (4):
- **F-01:** Autenticación y acceso (login)
- **F-02:** Cargar horas semanales (carga principal)
- **F-03:** Ajustar horas observadas (respuesta a observaciones)
- **F-04:** Ver historial y filtros (visualización de cargas)

### Flujos Gestor (3):
- **F-05:** Autenticación y acceso (login)
- **F-06:** Ver horas pendientes y aprobar/observar/rechazar
- **F-07:** Cargar horas propias (con auto-aprobación)

### Flujos Admin (5):
- **F-08:** Autenticación y acceso (login)
- **F-09:** Gestión de usuarios (CRUD)
- **F-10:** Gestión de clientes (CRUD)
- **F-11:** Gestión de proyectos (CRUD) y asignación de usuarios
- **F-12:** Ver, aprobar, observar, rechazar horas (como gestor global)
  
- **Design System:** shadcn/ui + Tailwind CSS
  - Colores semánticos: primary, secondary, destructive, success, warning
  - Tipografía: Inter, escala xs-2xl
  - Componentes: Button, Input, Select, Dialog, Table, Badge, Alert, Card
  - Espaciado: 4px grid, breakpoints responsive (sm: 640px, md: 768px, lg: 1024px)
  
- **Accesibilidad:** 
  - Focus rings visibles
  - Contraste suficiente (WCAG AA)
  - Labels asociados a inputs

---

## Convenciones de copy (textos de UI)

- **Variedad de español:** Español latinoamericano, variante Perú.
- **Tratamiento al usuario:** Tuteo (`tú`). **No usar voseo rioplatense** (sin "Ingresá", "Seleccioná", "tenés", "podés", etc.).
- **Forma correcta para imperativos:**
  - ✅ `Ingresa`, `Registra`, `Selecciona`, `Establece`, `Completa`, `Define`, `Crea`, `Aprueba`, `Rechaza`
  - ❌ `Ingresá`, `Registrá`, `Seleccioná`, `Establecé`, `Completá`, `Definí`, `Creá`, `Aprobá`, `Rechazá`
- **Conjugaciones de segunda persona:**
  - ✅ `tienes`, `puedes`, `crees`, `puedes`
  - ❌ `tenés`, `podés`, `creés`
- **Vocabulario preferido:**
  - `enlace` en lugar de `link` para contextos formales
  - `restablecer` en lugar de `resetear`
  - `Inténtalo de nuevo` en lugar de `Intentá de nuevo`

---

## Decisiones de producto

- **Período retroactivo:** Sin límite — seekers pueden cargar horas de cualquier semana
- **Auditoria:** Se registra quién cambió qué y cuándo en cada TimeEntry
- **Notificaciones:** Email automático en eventos (aprobación, observación, ajustes, rechazo)
- **Auto-aprobación:** Gestor se auto-aprueba cuando carga horas en su propio proyecto (permitido)
- **Múltiples roles:** Un usuario puede ser Seeker en Proyecto A y Gestor en B (incluso ambos en C)
- **Horas rechazadas:** Definitivas — se visualizan sin opción de editar, nueva carga es entrada nueva
- **Aprobación:** No reversible — una vez aprobada, no se puede desaprobar

---

## Historias de Usuario

**Total:** 22 historias ✅

- **Epic 00 — General (5):** Login, Reset password, Home Seeker, Home Gestor, Home Admin
- **Epic 01 — Seeker (4):** Registrar horas, Ver historial, Ajustar observadas, **Alerta semanas sin carga (US-004)**
- **Epic 02 — Gestor (5):** Ver pendientes, Aprobar, Observar, Rechazar, Propias horas
- **Epic 03 — Admin (8):** Crear usuario, Crear cliente, Crear proyecto, Asignar usuarios, Editar usuario, Editar cliente, Editar proyecto, Administración de permisos/roles

Ver: `.ai/stories/README.md`

---

## Archivos de referencia

| Archivo | Contenido |
|---------|-----------|
| `.ai/brief.md` | Brief completo del producto ✅ |
| `.ai/stories/README.md` | Índice de 21 historias de usuario ✅ |
| `.ai/stories/epic-00-general.md` | Historias transversales ✅ |
| `.ai/stories/epic-01-seeker.md` | Historias Seeker ✅ |
| `.ai/stories/epic-02-gestor.md` | Historias Gestor ✅ |
| `.ai/stories/epic-03-admin.md` | Historias Admin ✅ |
| `.ai/ux/design-system.md` | Design System (shadcn/ui) ✅ |
| `.ai/ux/flows/rol-flows.md` | 12 flujos UX detallados (Seeker 4, Gestor 3, Admin 5) ✅ |
| `.ai/ux/screens/` | 20+ especificaciones de pantallas completadas ✅ |
| `.ai/preview/index.html` | Índice central de todos los previews |
| `.ai/preview/s00-login.html` | Preview interactivo del login |
| `.ai/preview/s00-recuperar-contrasena.html` | Preview interactivo de recuperación |
| `.ai/preview/s01-home-seeker.html` | Preview interactivo del home Seeker |
| `.ai/preview/s01-cargar-horas.html` | Preview interactivo del formulario de carga |
| `.ai/SPECIFICATION-SUMMARY.md` | Referencia técnica centralizada (campos, validaciones, endpoints, estados) |
| `.ai/api/contracts-rol.md` | Contratos REST con request/response/errores ✅ (35+ endpoints) |
| `.ai/api/mocks/auth.json` | Mocks de autenticación ✅ |
| `.ai/api/mocks/time-entries.json` | Mocks de registros de horas ✅ |
| `.ai/api/mocks/users.json` | Mocks de usuarios ✅ |
| `.ai/api/mocks/clients.json` | Mocks de clientes ✅ |
| `.ai/api/mocks/projects.json` | Mocks de proyectos ✅ |
| `.ai/api/mocks/config.json` | Mocks de tablas de configuración/lookup ✅ |
| `.ai/db/schema.md` | Schema de base de datos |
| `.ai/pendientes.md` | Decisiones bloqueantes (8 cerradas ✅) |
| `WORKFLOW.md` | Checklist por etapa |

---

