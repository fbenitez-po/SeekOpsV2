## Context

Hoy el estado de revisión de horas está triplicado: `time_entries.status` (rollup de semana), `time_entry_lines.status` (fuente de verdad de facto) y `time_entry_approvals.action` (log de auditoría append-only sin `PENDIENTE`). Al aprobar-con-observación, `recordApproval` ([repository.ts:290-301](../../../backend/src/modules/timeEntries/timeEntries.repository.ts#L290-L301)) **pisa `time_entry_lines.hours/extra_hours`** con la sugerencia del gestor, y el frontend del gestor envía las líneas editadas además de la sugerencia ([HorasEquipo.jsx:99-107](../../../frontend/src/pages/gestor/HorasEquipo.jsx#L99-L107)). El seeker ve `l.horas` ([MisHoras.jsx:34](../../../frontend/src/pages/seeker/MisHoras.jsx#L34)) y por eso percibe la sugerencia como propia.

El schema es gestionado por Prisma (`backend/prisma/schema.prisma` + `migrations/`). El entorno es local y sus datos son desechables (`prisma migrate reset` + seed). El contrato visual está fijado en `.ai/preview/` y los previews aprobados.

## Goals / Non-Goals

**Goals:**
- Una única fuente de verdad del estado de revisión: `time_entry_approvals`, **una fila por línea**, creada en `PENDIENTE` al cargar.
- `time_entry_lines` inmutable (registro de lo cargado por el seeker).
- Eliminar el estado de semana (columna, derivación y badge en API/UI).
- Arreglar el bug: la observación guarda horas solo en `suggested_*`, nunca en líneas.
- Definir "horas efectivas" por línea (observada → sugeridas; aprobada → cargadas).

**Non-Goals:**
- Reintroducir la edición/reenvío del seeker sobre la misma línea (no existe; re-carga = par nuevo línea+approval).
- Backfill de datos productivos (entorno local desechable).
- Rediseño visual: se mantiene el design system y se reusa el patrón desplegable ya existente.

## Decisions

### D1 — La approval es la fuente de verdad, 1 fila por línea
`time_entry_approvals` gana `time_entry_line_id` (FK, `onDelete: Cascade`) y se mantiene `project_id`. La columna `action` se renombra a `status` con default `PENDIENTE` (valores `PENDIENTE | APROBADO | APROBADO_CON_OBSERVACION | RECHAZADO`). Se agregan `reviewed_by VARCHAR(50)` y `reviewed_at TIMESTAMP` (la revisión del gestor; `created_*` = generación del `PENDIENTE` en la carga).

- **Alternativa descartada (append + última gana):** insertar una fila nueva por cada acción y derivar el estado actual como la última fila. Se descartó porque el flujo de negocio no contempla reenvío sobre la misma línea: un rechazo seguido de re-carga genera **una línea nueva** con su propia approval, así que cada approval tiene un ciclo de vida lineal `PENDIENTE → terminal` y mutar la fila es más simple y suficiente para la auditoría (`created_*` + `reviewed_*`).

### D2 — Estado por línea, sin estado de semana
Se eliminan `time_entries.status` (+ `idx_time_entries_status`) y `time_entry_lines.status` (+ índice, + `reviewed_by`/`reviewed_at` que pasan a la approval). Se elimina `computeWeekRollup`. El mapper deja de exponer `entrada.estado` y deriva `lineas[].estado` matcheando la approval por `time_entry_line_id`.

- **Alternativa descartada (derivar el estado de semana al vuelo):** mantener el badge calculándolo desde approvals sin persistirlo. Se descartó por decisión de producto: el estado de semana no aporta; el historial muestra el bloque con proyectos desplegables y su estado por línea.

### D3 — Creación atómica de líneas + approvals
En `create`, usar `createManyAndReturn` (disponible en Prisma 7.8) para obtener los `id` de las líneas y, en la **misma transacción**, crear una approval `PENDIENTE` por línea (`time_entry_line_id`, `project_id`).

### D4 — `recordApproval` muta la approval y no toca líneas
Reescritura: localizar la approval `PENDIENTE` de la `linea_id` objetivo y mutarla al estado resultante seteando `reviewed_by`/`reviewed_at`; en observe, setear `suggested_hours`/`suggested_extra_hours` y `comment`; en reject, `rejection_reason`. **Eliminar** el bloque que actualiza `time_entry_lines` (290-320) y el update de `time_entries.status` (328-331). La validación "solo pendientes" se hace sobre el estado de la approval.

### D5 — Filtros pasan a approvals
`findAll`: el filtro `?estado=` y el alcance del gestor se expresan con `time_entry_approvals.some({ status, projects:{ manager_id } })`. Para SEEKER se acota a `user_id`; para ADMIN sin restricción de manager. `findExistingLineForProject` bloquea la carga si existe una línea activa de `(usuario, semana, proyecto, categoría)` cuya approval no es `RECHAZADO`. `findSeekersWithLoadData` deja de usar `te.status != 'RECHAZADO'` y considera líneas con approval no rechazada.

### D6 — Horas efectivas
Helper `horasEfectivas(linea, approval)`:
- `APROBADO_CON_OBSERVACION` → `suggested_hours`/`suggested_extra_hours` (fallback a las cargadas si fueran null).
- `APROBADO` → `hours`/`extra_hours` de la línea.
- `PENDIENTE`/`RECHAZADO` → 0 (no aporta).
Se usa en costos de personal, totales y reportes, **y son las horas que el seeker visualiza** para una línea resuelta, con el estado de su approval (aprobada → horas cargadas; observada → horas sugeridas). `time_entry_lines` permanece inmutable en la BD: la sugerencia solo vive en la approval; el cómputo de horas efectivas es de lectura. El mapper expone por línea las horas efectivas y el estado de la approval (y opcionalmente las horas cargadas originales como referencia).

### D7 — Contrato de la API estable salvo lo retirado
Se conserva la forma de `lineas[].estado` y `aprobaciones[]` (alias `tea.status AS accion` para no romper consumidores como [HomeGestor.jsx:23](../../../frontend/src/pages/gestor/HomeGestor.jsx#L23)). Se agrega `linea_id` a los payloads de approve/observe/reject; observe deja de aceptar `lineas[]`. Se retira `entrada.estado`.

## Risks / Trade-offs

- **Colisión de keys en UI con re-cargas** → en `MisHoras`/`HomeSeeker`, `agruparPorLinea`/`agruparPorProyecto` usan key `proyecto:categoria`; con una línea rechazada + una nueva pendiente del mismo par puede haber key duplicada. Mitigación: incluir `linea_id` en la key.
- **Consumidores que leen `entrada.estado`** → romperían al retirarlo. Mitigación: barrer y migrar los 6 componentes listados antes de mergear; el estado por línea ya está disponible.
- **Cómputo de costos** → cambia la fuente de horas para observadas (sugeridas, no cargadas). Mitigación: encapsular en `horasEfectivas` y cubrir con los escenarios del spec.
- **Migración destructiva (drop de columnas `status`)** → pérdida de estado histórico de líneas/semana. Aceptable: entorno local desechable; se ejecuta `migrate reset` + seed.

## Migration Plan

1. Editar `backend/prisma/schema.prisma` (D1, D2).
2. `npx prisma migrate dev --name approvals_as_source_of_truth` → genera SQL en `migrations/`. Verificar que el rename `action`→`status` no se traduzca a drop+add si se quiere preservar prod a futuro.
3. Local: `npx prisma migrate reset` (recrea + seed).
4. Implementar backend (repository/service/schema/mapper) y luego frontend.
5. Sincronizar docs: `.ai/db/schema.md`, `.ai/db/schema.sql` (líneas 300-366), `.ai/context.md`, US de aprobación. `.ai/db/data.sql` sin cambios.
6. **Rollback:** revertir la migración (`migrate resolve`/`reset` en local) y el código; no hay datos productivos comprometidos.

## Open Questions

- Resuelto: el seeker ve las **horas efectivas** por línea (aprobada → cargadas; observada → sugeridas) con el estado de la approval; los totales (`total_horas`/`total_extras`) también se calculan con horas efectivas.
