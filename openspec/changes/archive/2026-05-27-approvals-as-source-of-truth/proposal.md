## Why

La aprobación con observación funciona mal: al observar, el backend **pisa las horas que cargó el seeker** en `time_entry_lines` con las que sugiere el gestor, y el seeker termina viendo la sugerencia como si fuera lo suyo. La causa de fondo es que el estado de revisión está **triplicado** (`time_entries.status`, `time_entry_lines.status`, `time_entry_approvals.action`) y la sugerencia no tiene un lugar propio aislado. Queremos una única fuente de verdad del estado, por línea, y que la carga del seeker sea inmutable.

## What Changes

- **BREAKING** El estado de revisión pasa a vivir **solo en `time_entry_approvals`**, con **una fila por línea** creada en estado `PENDIENTE` cuando el seeker carga las horas. El gestor muta esa fila a `APROBADO | APROBADO_CON_OBSERVACION | RECHAZADO`.
- **BREAKING** Se elimina la columna `status` de `time_entries` y de `time_entry_lines` (más `reviewed_by`/`reviewed_at` de las líneas). `time_entry_lines` queda como registro **inmutable** de lo que cargó el seeker.
- **BREAKING** Se elimina el **estado a nivel de semana** por completo (columna, derivación y badge en API/UI). Solo existe estado por **proyecto + categoría** (= línea).
- **Fix del bug:** aprobar-con-observación guarda las horas del gestor **solo** en `suggested_hours`/`suggested_extra_hours` de la approval; nunca toca `time_entry_lines`.
- `time_entry_approvals` gana `time_entry_line_id` (FK a la línea), renombra `action` → `status` (con `PENDIENTE`) y suma `reviewed_by`/`reviewed_at` (quién/cuándo revisó el gestor).
- **Horas efectivas:** para costos, totales y reportes, una línea `APROBADO_CON_OBSERVACION` cuenta con las horas **sugeridas** por el gestor; `APROBADO` cuenta con las **cargadas**; `PENDIENTE`/`RECHAZADO` no cuentan.
- API: las acciones approve/observe/reject identifican la línea por `linea_id`; observe deja de recibir `lineas[]`. La respuesta de listado/detalle deja de exponer `entrada.estado`.
- UI: se quita el badge de estado de semana en todas las pantallas; `Historial Reciente` (HomeSeeker) adopta el patrón desplegable bloque→proyectos+estados de `Historial Completo`.

## Capabilities

### New Capabilities
<!-- ninguna -->

### Modified Capabilities
- `hours-approval`: el estado deja de almacenarse en líneas/semana y pasa a `time_entry_approvals` (una fila PENDIENTE por línea en la carga); se elimina el estado de semana; la observación aísla la sugerencia y no modifica la línea; se define el cómputo de "horas efectivas" por estado de línea.

## Impact

- **Schema (Prisma + migración):** `time_entries`, `time_entry_lines`, `time_entry_approvals` en `backend/prisma/schema.prisma` + nueva migración. Local es desechable (`migrate reset` + seed).
- **Backend (`backend/src/modules/timeEntries/`):** `repository.ts` (create genera approvals PENDIENTE, `recordApproval` muta la approval y deja de tocar líneas, `findAll`/`findExistingLineForProject`/`getLinesForProject`/`findApprovals`/`findSeekersWithLoadData` pasan a leer approvals; eliminar `computeWeekRollup`), `service.ts`, `schema.ts` (zod: `linea_id`), `mapper.ts` (quitar `entrada.estado`, derivar estado por línea desde approval).
- **Frontend:** `HorasEquipo.jsx` (payload observe: `linea_id`, sin `lineas`), `MisHoras.jsx`, `MisHorasGestor.jsx`, `HomeSeeker.jsx`, `HomeGestor.jsx`, `TodasLasHoras.jsx` (quitar badge de semana; derivar observación desde `aprobaciones[]`).
- **Cómputo de costos de personal:** pasa a usar "horas efectivas" por línea (sugeridas si observada).
- **Docs:** `.ai/db/schema.md`, `.ai/db/schema.sql`, `.ai/context.md` y las US de aprobación afectadas. `.ai/db/data.sql` sin cambios.
