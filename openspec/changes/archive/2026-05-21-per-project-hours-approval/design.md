## Context

El módulo `timeEntries` modela la carga semanal de horas. Una `time_entries` (semana de un usuario) contiene varias `time_entry_lines` (una por proyecto + categoría de ingreso). Hoy el estado de aprobación vive en `time_entries.status` (un único valor por semana) y la verificación de gestor en `approve/observe/reject` mira **solo la primera línea** vía `findFirstLineProjectId` ([service.ts:119-180](backend/src/modules/timeEntries/timeEntries.service.ts#L119)). Resultado: un gestor aprueba o queda bloqueado para aprobar la semana completa, incluidas horas de proyectos que no administra.

`projects.manager_id` define el gestor de cada proyecto. `time_entry_approvals` registra el historial, hoy enlazado solo a `time_entry_id`. Aguas abajo, `personnelCosts.repository.ts` suma horas `WHERE te.status = 'APROBADO'` (a nivel semana).

Decisiones de producto ya cerradas en explore: estado por línea; semana = rollup derivado; sin auto-aprobación (todos los gestores son seekers); el seeker no edita sino que re-carga proyectos rechazados; acción del gestor sobre el bloque del proyecto ("solicitud").

## Goals / Non-Goals

**Goals:**
- Que cada gestor apruebe/rechace/observe únicamente las líneas de los proyectos que administra.
- Mover el estado de aprobación de la semana a la línea, manteniendo `time_entries.status` como rollup derivado para compatibilidad de filtros.
- Garantizar que una solicitud pendiente no desaparezca de la bandeja del gestor cuando otro proyecto de la misma semana ya fue aprobado.
- Corregir el cómputo financiero para que sume horas por línea aprobada (incluyendo `APROBADO_CON_OBSERVACION`).

**Non-Goals:**
- Cambiar el formato de código de semana (`S20/26`) ni la validación de horas (múltiplos de 0.5, rangos).
- Rediseñar el sistema de roles/permisos más allá del scope de aprobación.
- Notificaciones nuevas (más allá del recordatorio existente).
- Cambiar cómo el seeker carga la semana (sigue siendo una carga multi-proyecto).

## Decisions

### 1. Estado por línea + rollup derivado en la semana
Agregar `status` a `time_entry_lines` (`VARCHAR(50)`, default `PENDIENTE`), más `reviewed_by`/`reviewed_at` para trazabilidad ligera. `time_entries.status` se **mantiene** pero pasa a recalcularse desde las líneas tras cada acción.

- **Rollup** (reutiliza los estados existentes, **no** se introduce `EN_REVISION`), por precedencia sobre las líneas activas: (1) si alguna está `PENDIENTE` → `PENDIENTE`; (2) si no hay pendientes pero alguna está `RECHAZADO` → `RECHAZADO` (la semana espera re-carga del seeker); (3) si alguna está `APROBADO_CON_OBSERVACION` → `APROBADO_CON_OBSERVACION`; (4) en otro caso → `APROBADO`. El cálculo se centraliza en una función helper en `repository`/`mapper`. Así `ESTADO_LABELS`/badges del frontend no cambian.
- **Alternativa descartada**: eliminar `time_entries.status`. Más limpio conceptualmente, pero obliga a reescribir todos los filtros de lista y rompe más superficie; el usuario eligió mantener el rollup.

### 2. Unidad de acción = "solicitud" (proyecto-bloque), almacenada por línea
La API de aprobación recibe el `proyecto_id` (preferido por simplicidad de UI) y aplica la acción a **todas** las líneas activas de ese proyecto en la entry; internamente puede resolverse a `line_ids`. Autorización: para cada línea afectada, `projects.manager_id === userId` (o `ADMIN`).

- Endpoints (reemplazan los actuales que operan sobre la entry completa):
  - `POST /time-entries/:id/approve` body `{ proyecto_id }`
  - `POST /time-entries/:id/observe` body `{ proyecto_id, comentario_observacion, lineas? }` — `lineas` (ajuste de horas) restringido a líneas del proyecto **que estén `PENDIENTE`**. No se permite observar/ajustar líneas ya `APROBADO`/`RECHAZADO`.
  - `POST /time-entries/:id/reject` body `{ proyecto_id, razon_rechazo, permitir_reenvio? }`
- `findFirstLineProjectId` se elimina; la autorización se calcula sobre el conjunto de líneas del proyecto indicado.
- **Alternativa considerada**: `line_ids[]` explícitos (selección línea por línea). Se mantiene la puerta abierta a aceptar `line_ids` además de `proyecto_id`, pero la UI confirmada actúa por bloque de proyecto, así que `proyecto_id` es el contrato primario.

### 3. Sin auto-aprobación
Eliminar la rama `isOnlyGestor` ([service.ts:102](backend/src/modules/timeEntries/timeEntries.service.ts#L102)). `create` siempre crea líneas `PENDIENTE`.

### 4. El seeker no edita; re-carga proyectos rechazados
- Eliminar `PUT /time-entries/:id` (`adjust`), `AdjustTimeEntrySchema`, `updateLines`, y la página/ruta `AjustarHoras`.
- `create` (o un endpoint de re-carga) acepta cargar un proyecto solo si **no** existe línea activa `PENDIENTE`/`APROBADO`/`APROBADO_CON_OBSERVACION` para ese `(usuario, semana, proyecto)`. Si la línea previa de ese proyecto está `RECHAZADO`, se permite crear una nueva línea `PENDIENTE`. La línea rechazada **NO es una baja lógica**: permanece con `is_active = true` y `status = 'RECHAZADO'` (queda visible en el historial). Por eso pueden coexistir dos líneas activas del mismo proyecto: la rechazada y la nueva pendiente.
- `findExistingEntry` cambia su unicidad de `(user, week)` a `(user, week, project)`. Una semana puede seguir teniendo una sola `time_entries`; la re-carga **agrega líneas** a esa entry existente en vez de crear otra.

### 5. Auditoría por proyecto/línea
Agregar `project_id` (`@db.Uuid`, nullable para histórico) a `time_entry_approvals`. Cada acción del gestor crea un registro con su `project_id`, `action`, comentario/razón y `created_by`. `findApprovals` y el mapper exponen el proyecto asociado para que la UI muestre el historial por solicitud.

### 6. Cómputo financiero por línea
En `personnelCosts.repository.ts`, el fragmento `horasUsadasFragment` deja de filtrar `te.status = 'APROBADO'` y pasa a `tel.status IN ('APROBADO','APROBADO_CON_OBSERVACION')`, sumando `tel.hours + tel.extra_hours` solo de líneas aprobadas. Esto corrige la inconsistencia donde `APROBADO_CON_OBSERVACION` no contaba.

### 7. Lista filtrada por línea para el gestor
`findAll` ya filtra para GESTOR por `time_entry_lines.some.projects.manager_id` ([repository.ts:62-65](backend/src/modules/timeEntries/timeEntries.repository.ts#L62)). El filtro `estado` debe reinterpretarse: para la bandeja del gestor, "pendiente" = entries con ≥1 línea `PENDIENTE` **de sus proyectos**. El endpoint devuelve, por entry, solo las líneas relevantes al gestor (o el mapper marca cuáles son suyas) para que la UI arme las solicitudes.

## Risks / Trade-offs

- **Migración de datos históricos** → Backfill: copiar `time_entries.status` a `time_entry_lines.status` de todas sus líneas. Entradas antiguas quedan con todas sus líneas en el mismo estado proyectado, preservando el comportamiento financiero histórico (salvo la corrección intencional de `APROBADO_CON_OBSERVACION`).
- **Rollup desincronizado** → Recalcular el rollup dentro de la misma transacción que actualiza líneas (`recordApproval`); nunca escribir `time_entries.status` por fuera de ese helper.
- **Doble fuente de verdad (línea vs rollup)** → El rollup es estrictamente derivado y solo informativo/para filtros; ninguna lógica de negocio (finanzas, autorización) debe leerlo. Documentarlo en `schema.md`.
- **Cambio de contrato de API rompe el frontend** → Coordinar despliegue backend+frontend juntos; el frontend es del mismo repo. Actualizar mocks en `.ai/api/mocks` si aplica.
- **Re-carga y unicidad** → Garantizar a nivel de servicio (no solo índice) que no se permita una segunda línea activa de un proyecto ya pendiente/aprobado. Índice parcial único `(time_entry_id, project_id) WHERE is_active AND status <> 'RECHAZADO'` — excluye las rechazadas para que la nueva línea pendiente pueda coexistir con la rechazada (ambas activas).
- **`APROBADO_CON_OBSERVACION` ahora suma en finanzas** → Es un cambio de cómputo respecto a hoy; validar con finanzas que es el comportamiento deseado (ya confirmado como default en explore).

## Migration Plan

1. `schema.prisma`: agregar `time_entry_lines.status` (default `PENDIENTE`), `reviewed_by`, `reviewed_at`; agregar `time_entry_approvals.project_id` (nullable).
2. `prisma migrate dev --name per_project_hours_approval` con SQL de backfill: `UPDATE time_entry_lines tel SET status = te.status FROM time_entries te WHERE tel.time_entry_id = te.id;` (y backfill de `project_id` en aprobaciones históricas vía la línea/entry si es factible, o dejar NULL).
3. Índice parcial único para la regla de re-carga.
4. Desplegar backend y frontend juntos (mismo repo).
5. **Rollback**: la migración es aditiva (columnas nuevas); revertir código deja las columnas sin uso. Down de Prisma elimina las columnas si se requiere.
6. Actualizar `.ai/db/schema.md` y stories afectadas (US de seeker/gestor) en la misma sesión (regla de consistencia de CLAUDE.md).

## Open Questions

Resueltas en explore:
- **Línea rechazada**: NO es baja lógica. Permanece `is_active = true` con `status = 'RECHAZADO'`, visible en el historial; la re-carga agrega una nueva línea `PENDIENTE` que coexiste con ella.
- **Estado intermedio del rollup**: se reutiliza `PENDIENTE` (no se crea `EN_REVISION`); `ESTADO_LABELS`/badges no cambian.
- **`observe`/ajuste de horas**: solo sobre líneas en estado `PENDIENTE`.
