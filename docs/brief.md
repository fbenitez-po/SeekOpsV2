# Brief — Seekops

## Visión del producto

Seekops es una plataforma que sirve para registrar las horas trabajadas de los empleados (seekers) en cada proyecto de cada cliente o proyectos internos de la empresa Seek. Esta plataforma la utilizarán todos los empleados de Seek. El objetivo principal es que cada empleado pueda registrar las horas trabajadas en una semana entera por proyecto, hacer un seguimiento de los proyectos activos, de los ingresos y costos.

## El problema

Existe una versión obsoleta de la plataforma de carga de horas. Los usuarios no cargan las horas activamente o requieren recordatorios constantes. La plataforma necesita ser modernizada tanto funcional como técnicamente para mejorar la experiencia de uso y garantizar que los registros de horas se mantengan actualizados.

---

## La solución

Seekops es una plataforma web moderna que permite a los empleados (seekers) registrar sus horas trabajadas semanalmente por proyecto, con un flujo de aprobación claro y gestión completa de usuarios, clientes y proyectos por parte de administradores.

---

## MVP — Alcance

### Incluido
- **Carga de horas semanales:** Seekers registran horas por proyecto asignado (semana, proyecto, categoría, horas, horas extra, comentario)
- **Flujo de aprobación:** Estado pendiente → aprobado / rechazado / observado
- **Ajuste de horas observadas:** Seeker corrige horas cuando recibe observación
- **Visualización de horas:** Filtros por proyecto, estado, seeker (según rol)
- **Gestión de usuarios:** Admin crea, edita, lista usuarios con asignación a proyectos
- **Gestión de clientes:** Admin crea, edita, lista clientes
- **Gestión de proyectos:** Admin crea, edita, lista proyectos y asigna usuarios
- **Roles con permisos diferenciados:** Seeker, Gestor (aprueba horas de su equipo), Admin (todo)

### Excluido (para después)
- Regularización de horas de seekers dados de baja (post-MVP)
- Reportes y analytics avanzados (post-MVP)
- Mobile app (web primero)
- Integraciones externas (post-MVP)

---

## Entidades principales

- **User** — Seeker, Gestor, Admin; asignados a proyectos
- **Client** — Clientes para los que se trabaja
- **Project** — Proyectos de clientes; tienen usuarios asignados
- **TimeEntry** — Registro de horas semanales (semana, proyecto, categoría, horas, extras, estado)
- **TimeEntryApproval** — Historial de aprobaciones/observaciones por TimeEntry

---

## Estados de un registro de horas

```
Pendiente → Aprobado
          → Observado → (el Seeker ajusta) → Pendiente
          → Rechazado
```

---

## Reglas de negocio

- Un Seeker solo puede cargar horas en proyectos a los que está asignado.
- En una misma carga semanal no puede repetirse el mismo proyecto.
- Las horas overtime se registran en un campo separado al de horas normales.
- Un Gestor solo ve y aprueba horas de los proyectos que gestiona.
- El Administrador puede cargar y ajustar horas de seekers dados de baja o sin gestor activo.
- Un registro observado solo puede ser ajustado por el Seeker que lo creó (o por el Admin en caso de regularización).

---

## Roles y flujos clave

### Seeker
Registra sus horas invertidas en los proyectos asignados. Puede cargar horas de cualquier semana, visualizar historial, y ajustar cuando recibe observaciones del gestor.

### Gestor
Aprueba, rechaza u observa las horas registradas por los seekers de su proyecto. También puede registrar sus propias horas como seeker.

### Administrador
Gestiona toda la plataforma: usuarios, clientes, proyectos. Aprueba/observa horas de seekers sin gestor activo. Acceso a backoffice completo.

--- 

## Stack confirmado

- **Frontend:** React (web)
- **Backend:** Node.js + Express
- **BD:** PostgreSQL
- **Autenticación:** JWT
- **Deploy:** Por confirmar
- **Entorno local:** Docker (base de datos y servicios necesarios para desarrollo) |


## Métricas de éxito

- Seekers cargan sus horas semanales sin recordatorios
- Gestores aprueban horas dentro de los plazos esperados
- Tasa de adopción: 100% de usuarios activos cargando horas semanal
- Cero registros perdidos (migración correcta desde versión anterior)

---

## Dependencias y bloqueadores

- ❌ No hay dependencias bloqueantes — se comienza de cero
- Migración de datos desde versión anterior (posterior a desarrollo)

---

## Aprobación

- [x] PM/Producto: Aprobado ✅ Fecha: 2026-04-23
- [x] Tech Lead: Aprobado ✅ Fecha: 2026-04-23
- [x] Stakeholder/Cliente: Aprobado ✅ Fecha: 2026-04-23

✅ **Brief aprobado. Listo para Stories.**

