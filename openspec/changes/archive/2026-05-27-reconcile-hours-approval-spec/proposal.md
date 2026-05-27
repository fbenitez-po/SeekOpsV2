## Why

El spec canónico `hours-approval` quedó desactualizado respecto del código. Los changes `approvals-as-source-of-truth` y `simplify-time-entry-approvals` se archivaron con `--skip-specs` (sus deltas no aplicaban: referenciaban headers desalineados con el canónico). El código avanzó pero el spec sigue describiendo el modelo anterior: estado de semana derivado, `status` en `time_entries`/`time_entry_lines`, y un `rejection_reason` dedicado. Este change reconcilia el spec con el código real (verificado contra `schema.prisma` y `timeEntries.mapper.ts`).

## What Changes

- El estado de revisión vive **exclusivamente en `time_entry_approvals`** (una fila `PENDIENTE` por línea en la carga); `time_entries`/`time_entry_lines` no tienen `status`.
- Se **elimina** el requirement "Estado de la semana derivado" (la API ya no expone estado de semana).
- Las acciones approve/observe/reject operan por `linea_id` mutando la approval; la observación aísla la sugerencia en `suggested_*` sin tocar la línea.
- `comment` es el portador unificado de observación y motivo de rechazo (no hay `rejection_reason`).
- Se renombra "Cómputo financiero de horas por línea aprobada" → "Cómputo de horas efectivas por línea aprobada" (observada→sugeridas, aprobada→cargadas, pendiente/rechazada→0).
- Se agregan los requirements "Inmutabilidad de las horas cargadas" y "La API no expone estado de semana".

## Capabilities

### New Capabilities
<!-- ninguna -->

### Modified Capabilities
- `hours-approval`: el spec se actualiza para reflejar el estado real del código tras `approvals-as-source-of-truth` + `simplify-time-entry-approvals`.

## Impact

- **Spec-only:** no hay cambios de código ni de schema. El código ya implementa este comportamiento; este change solo sincroniza la documentación canónica.
- **Specs:** reescribe `openspec/specs/hours-approval/spec.md` vía delta (MODIFIED/ADDED/REMOVED) al archivar (sin `--skip-specs`).
- **Verificación:** afirmaciones contrastadas contra `backend/prisma/schema.prisma` (sin `status` en `time_entries`/`time_entry_lines`, sin `rejection_reason`; `time_entry_approvals` con `status`/`comment`/`reviewed_by`/`reviewed_at`) y `backend/src/modules/timeEntries/timeEntries.mapper.ts` (entrada sin `estado` de semana; `estado` y `horas_efectivas` por línea).
