## Why

Hoy las horas semanales se aprueban a nivel de **toda la semana** (`time_entries.status`), y la verificación de gestor mira **solo la primera línea** de la entrada. Si un seeker carga horas de varios proyectos en la misma semana, un único gestor termina aprobando (o quedando bloqueado para aprobar) horas de proyectos que no administra. El negocio necesita que **cada gestor apruebe únicamente las horas de los proyectos que gestiona**.

## What Changes

- **BREAKING** — La unidad de aprobación pasa de "la semana" a la **solicitud = (seeker × semana × proyecto)**. El estado de aprobación se guarda **por línea** (`time_entry_lines.status`); `time_entries.status` se convierte en un **rollup derivado** recalculado desde las líneas.
- El gestor aprueba / rechaza / aprueba-con-observación **solo las líneas de los proyectos que administra**. La acción opera sobre el bloque completo de un proyecto dentro de una semana (recibe `proyecto_id` o los `line_ids` de ese bloque) y valida `projects.manager_id` de cada línea afectada.
- **BREAKING** — Se elimina la auto-aprobación del "solo gestor" ([service.ts:102](backend/src/modules/timeEntries/timeEntries.service.ts#L102)). Como todos los gestores son también seekers, toda carga nace `PENDIENTE`; el gestor aprueba sus propias horas manualmente.
- **BREAKING** — El seeker **ya no edita** lo cargado: se elimina `PUT /time-entries/:id` (`ajustar`) y la pantalla `AjustarHoras.jsx`. Si un proyecto le es **rechazado**, el seeker puede **volver a cargar ese proyecto** para esa semana (nueva línea; la rechazada se conserva para auditoría). El guard de duplicados pasa de `(usuario, semana)` a `(usuario, semana, proyecto)`.
- La bandeja del gestor (`HorasEquipo.jsx`) se reescribe como **lista de solicitudes por proyecto**, filtrada por *líneas pendientes de sus proyectos* (no por el rollup de la semana), evitando que una solicitud desaparezca cuando otro proyecto de la misma semana ya fue aprobado.
- Las vistas del seeker muestran **estado por proyecto** dentro de la semana (`MisHoras.jsx` con fila expandible; recuentos de `HomeSeeker.jsx` por estado de línea).
- `time_entry_approvals` gana un vínculo a la línea/proyecto (`line_id` o `project_id`) para auditar quién aprobó qué.
- Finanzas deja de filtrar `te.status = 'APROBADO'` y suma solo **líneas** en estado `APROBADO` o `APROBADO_CON_OBSERVACION`, resolviendo una inconsistencia pre-existente donde `APROBADO_CON_OBSERVACION` no contaba ([personnelCosts.repository.ts:35](backend/src/modules/finance/personnelCosts/personnelCosts.repository.ts#L35)).

## Capabilities

### New Capabilities
- `hours-approval`: Flujo de aprobación de horas registradas, alcance por proyecto/gestor — estados por línea, acciones de aprobar/rechazar/observar acotadas a los proyectos del gestor, rollup derivado de la semana, re-carga de proyectos rechazados y auditoría por línea.

### Modified Capabilities
<!-- Ninguna: el único spec existente (api-contract) describe convenciones de contrato de API y no cambia sus requisitos a nivel de comportamiento. -->

## Impact

**Backend**
- `backend/prisma/schema.prisma` — `time_entry_lines.status` (+ `reviewed_by`/`reviewed_at`), vínculo `line_id`/`project_id` en `time_entry_approvals`; nueva migración Prisma + backfill.
- `backend/src/modules/timeEntries/{service,repository,schema,routes,controller,mapper}.ts` — estado por línea, scope del gestor, eliminación de `ajustar`/`findFirstLineProjectId`, rollup derivado, re-carga por proyecto.
- `backend/src/modules/finance/personnelCosts/personnelCosts.repository.ts` — conteo de horas por líneas aprobadas.

**Frontend**
- `frontend/src/pages/gestor/HorasEquipo.jsx` — reescritura a bandeja de solicitudes por proyecto.
- `frontend/src/pages/seeker/{MisHoras,HomeSeeker,CargarHoras}.jsx` — estado por proyecto y re-carga de rechazados.
- `frontend/src/pages/seeker/AjustarHoras.jsx` + `frontend/src/App.jsx` — eliminar página y ruta.
- `frontend/src/pages/admin/TodasLasHoras.jsx` — reject/observe por línea.
- `frontend/src/services/api.js` — `line_ids`/`proyecto_id` en approve/observe/reject; quitar `ajustar`.

**Datos / migración**: backfill de `time_entry_lines.status` desde el `time_entries.status` actual; las entradas históricas conservan su estado agregado proyectado a todas sus líneas.
