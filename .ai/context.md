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

### Regla — nuevas funcionalidades siempre tienen historia de usuario

**Toda funcionalidad que se suma al sistema debe tener su historia de usuario antes o en el mismo momento en que se implementa.** No existe funcionalidad sin story.

Aplica a:
- Tabla nueva en el schema → debe existir una US que la justifique
- Endpoint nuevo en la API → debe existir una US que lo requiera
- Pantalla o componente nuevo en el frontend → ídem
- Lógica de negocio nueva en el backend → ídem

El flujo correcto es siempre **Story → Schema → API → Código**. Si se detecta código o schema sin story correspondiente, la story se escribe de inmediato, no después.

**Checklist al agregar cualquier funcionalidad nueva:**
1. ¿Existe una US que justifique esta funcionalidad? → si no, crearla antes de continuar
2. ¿La US tiene criterios de aceptación Given/When/Then? → si no, completarlos
3. ¿La US está en el epic correcto con ID único? → verificar que no haya conflictos de ID
4. ¿Se actualizó el conteo en `stories/README.md` y en `context.md`? → en la misma sesión

---

## Estado actual

- **Etapa:** Código (completado ✅) — Proyecto listo para ejecutar y testear
- **Completado:** 
  - 30 historias de usuario ✅
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
  2. ✅ Schema SQL completo en `.ai/db/setup_schema.sql` (fuente de verdad) + historial en `.ai/db/migrations_archive/`
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
- **Soft delete:** Users, Clients, Projects — campo `enabled` (boolean). Las tablas con soft delete tienen además `deleted_at` y `deleted_by` (email del responsable).
- **Auditoria:** Columnas `created_by` / `updated_by` en todas las tablas como `VARCHAR(255)` almacenando el **email** del usuario (sin FK). Migración 020 estandarizó: `activo → enabled`, `deactivated_at → deleted_at`, `created_by_user_id → created_by`, `nombre → name` en 6 tablas lookup. El JWT ahora incluye `email` y se propaga por toda la cadena route → service → data.
- **Email:** SMTP integrado con nodemailer (`emailService.js`). Dos tipos de email: bienvenida (link activación 48h) y reset de contraseña (link 1h). Si SMTP no está configurado, el link se imprime en consola (dev mode).
- **Activación de cuenta:** Nuevos usuarios no tienen contraseña. Al crearlos, se genera un token (tabla `password_reset_tokens`, válido 48h) y se envía email de bienvenida con link a `/activar-cuenta?token=...`. El endpoint de activación reutiliza `POST /api/auth/confirmar-reset`.
- **Acceso a proyectos del Gestor:** Un Gestor tiene acceso a todos los proyectos donde figura como `gestor_id` en la tabla `projects`, independientemente de si tiene fila en `project_users`. Esta regla aplica en tres puntos del backend: listar proyectos disponibles, verificar acceso al guardar horas, y listar time entries del panel. Los tres puntos fueron corregidos en `projectData.js` y `timeEntryData.js` (2026-04-24).
- **Áreas de usuario (M2M):** El campo `area_id` fue eliminado de `users`. Reemplazado por tabla `user_areas` (M2M). Un usuario debe tener al menos un área (validado en aplicación y route). El selector en UI es del mismo estilo toggle que los grupos.
- **Área de proyecto (opcional):** Los proyectos tienen un campo `area_id` nullable. En UI se controla con un checkbox "Este proyecto aplica a un área específica" que habilita un Select para elegir el área. Si el checkbox está desmarcado, se envía `null`.
- **Proyecciones de horas:** Tabla `hour_projections`. El gestor registra rangos de horas proyectadas para un usuario en un proyecto (fecha_inicio, fecha_fin, horas_proyectadas en NUMERIC 0.5). `categoria_id` es FK opcional a `client_categories`. Alertas en Home del Gestor. Endpoint: `GET /projections/alertas`.
- **Módulo Finanzas:** Tablas `periodos`, `ingresos`, `gastos_admin`, `costos_venta`, `costos_por_persona`. Los períodos son mensuales con estado abierto/cerrado. Los ingresos se registran por (proyecto, período). Los costos por persona incluyen remuneración, días hábiles y horas por día.
- **Módulo Comercial:** Tablas `tipos_documento` y `registros_comerciales`. Los registros comerciales vinculan propuestas/contratos a proyectos y responsables, con precio, moneda, tipo de documento y estado de facturación.
- **Clientes — campo nombre eliminado:** El campo `nombre` fue eliminado de `clients`. `razon_social` es el identificador principal (NOT NULL). `client_category_id` es nullable.
- **Proyectos — descripcion eliminada:** El campo `descripcion` fue eliminado de `projects`. Se agregaron `fecha_inicio_real` y `fecha_fin_real` para calcular desviaciones.

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
  
### Design System

Basado en shadcn/ui + Tailwind CSS. El preview aprobado en `.ai/preview/` es el contrato visual — el código debe coincidir exactamente.

| Token | Valor | Uso |
|-------|-------|-----|
| Primary | `#0f172a` (slate-900) | Botones, sidebar, links activos, logo |
| Background | `#f8fafc` (slate-50) | Fondo de todas las páginas |
| Card/Section | `#ffffff` | Fondo de cards y secciones |
| Border | `#e2e8f0` (slate-200) | Bordes de cards, inputs, separadores |
| Text principal | `#0f172a` / `#1e293b` | Títulos y texto importante |
| Text secundario | `#64748b` (slate-500) | Labels, subtítulos, placeholders |
| Destructive | `#dc2626` (red-600) | Errores, rechazos |
| Success badge | `bg:#d1fae5 text:#065f46` | Estado APROBADO |
| Warning badge | `bg:#fef3c7 text:#92400e` | Estado PENDIENTE |
| Error badge | `bg:#fee2e2 text:#7f1d1d` | Estado RECHAZADO |
| Muted badge | `bg:#e5e7eb text:#374151` | Estado neutral |
| Font | Inter, 400/500/600/700 | Todo el sistema |
| Border radius card | `0.75rem` | Cards y secciones |
| Border radius input | `0.5rem` | Inputs y botones |
| Input focus ring | `box-shadow: 0 0 0 3px rgba(15,23,42,0.08)` | Focus state |

**Layout:**
- **Sidebar**: fondo `#0f172a`, texto blanco, ancho `224px` (w-56)
- **Contenido**: fondo `#f8fafc`, max-width 6xl, padding `1.5rem`
- **Cards/Sections**: fondo blanco, borde `#e2e8f0`, border-radius `0.75rem`, padding `1.5rem`
- **Login**: gradiente `135deg, #f8fafc → #f1f5f9`, logo box navy con "S" blanca

**Componentes disponibles:** Button, Input, Select, Dialog, Table, Badge, Alert, Card  
**Tipografía:** Inter, escala xs-2xl  
**Espaciado:** 4px grid, breakpoints sm: 640px / md: 768px / lg: 1024px

**Accesibilidad:** Focus rings visibles, contraste WCAG AA, labels asociados a inputs.

---

## Convenciones

### Idioma por capa

| Capa | Idioma | Ejemplos |
|------|--------|---------|
| Código (JS/TS): variables, funciones, clases, columnas SQL, rutas de API | **Inglés** | `userId`, `created_at`, `getProjects()`, `/api/time-entries` |
| Comentarios de código | **Inglés** | `// fetch active projects for current user` |
| Commits de git | **Español** | `feat: agregar endpoint de proyecciones` |
| Textos de UI (labels, mensajes, placeholders, títulos, botones) | **Español latinoamericano — variante Perú** | `Ingresa tu contraseña`, `Selecciona un proyecto` |

**Regla de oro:** si lo ve el usuario en pantalla → español peruano. Si lo lee el desarrollador en el código → inglés.

### Estilo de nombres en código

- **JS/TS:** camelCase (`userId`, `getProjects`)
- **SQL:** snake_case (`user_id`, `created_at`)
- **Variables de entorno:** SCREAMING_SNAKE_CASE (`DB_HOST`, `JWT_SECRET`)

### Copy (textos de UI)

- **Variedad de español:** Español latinoamericano, variante Perú.
- **Tratamiento al usuario:** Tuteo (`tú`). **No usar voseo rioplatense** (sin "Ingresá", "Seleccioná", "tenés", "podés", etc.).
- **Forma correcta para imperativos:**
  - ✅ `Ingresa`, `Registra`, `Selecciona`, `Establece`, `Completa`, `Define`, `Crea`, `Aprueba`, `Rechaza`
  - ❌ `Ingresá`, `Registrá`, `Seleccioná`, `Establecé`, `Completá`, `Definí`, `Creá`, `Aprobá`, `Rechazá`
- **Conjugaciones de segunda persona:**
  - ✅ `tienes`, `puedes`, `crees`
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

**Total:** 30 historias ✅

- **Epic 00 — General (5):** Login, Reset password, Home Seeker, Home Gestor, Home Admin
- **Epic 01 — Seeker (4):** Registrar horas, Ver historial, Ajustar observadas, **Alerta semanas sin carga (US-004)**
- **Epic 02 — Gestor (6):** Ver pendientes (US-201), Aprobar (US-005), Observar (US-006), Rechazar (US-007), Propias horas (US-008), **Proyecciones de horas (US-209)**
- **Epic 03 — Admin (8):** Crear usuario, Crear cliente, Crear proyecto, Asignar usuarios, Editar usuario, Editar cliente, Editar proyecto, Administración de permisos/roles
- **Epic 04 — Finanzas y Comercial (7):** Gestionar períodos (US-401), Registrar ingresos (US-402), Gastos administrativos (US-403), Costos de venta (US-404), Costos por persona (US-405), Registros comerciales (US-406), Tipos de documento (US-407)

Ver: `.ai/stories/README.md`

---

## Archivos de referencia

| Archivo | Contenido |
|---------|-----------|
| `.ai/brief.md` | Brief completo del producto ✅ |
| `.ai/stories/README.md` | Índice de 30 historias de usuario ✅ |
| `.ai/stories/epic-00-general.md` | Historias transversales ✅ |
| `.ai/stories/epic-01-seeker.md` | Historias Seeker ✅ |
| `.ai/stories/epic-02-gestor.md` | Historias Gestor ✅ |
| `.ai/stories/epic-03-admin.md` | Historias Admin ✅ |
| `.ai/stories/epic-04-finanzas.md` | Historias Finanzas y Comercial ✅ |
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
| `.ai/db/setup_schema.sql` | **Fuente de verdad del schema** — DDL completo y actualizado |
| `.ai/db/setup_seeds.sql` | Seeds iniciales (catálogos + usuario admin) |
| `.ai/db/schema.md` | Documentación del schema (debe coincidir con `setup_schema.sql`) |
| `.ai/db/migrations_archive/` | Historial de migraciones incrementales (001 en adelante) |
| `.ai/pendientes.md` | Decisiones bloqueantes (8 cerradas ✅) |
| `WORKFLOW.md` | Checklist por etapa |

---

