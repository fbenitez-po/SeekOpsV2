# Design — reconcile-hours-approval-spec

## Origen de la deriva

`hours-approval` (canónico, source `per-project-hours-approval`, synced 2026-05-21) describe el modelo viejo. Dos changes posteriores cambiaron el código pero se archivaron con `--skip-specs` porque sus deltas no aplicaban sobre el canónico:

- `approvals-as-source-of-truth`: MODIFIED `Cómputo de horas efectivas...` (el canónico lo llama `Cómputo financiero...`) y REMOVED `Estado de la semana derivado` — el archiver falló en cascada.
- `simplify-time-entry-approvals`: REMOVED `Campo can_resubmit en rechazo` — ese requirement **nunca estuvo** en el canónico (huérfano).

## Estado final = canónico + delta(approvals) + delta(simplify)

Este change reconstruye los deltas de ambos changes archivados, pero **alineados a los headers que hoy existen en el canónico**, para que `openspec archive` aplique limpio.

| Requirement canónico | Acción de reconciliación |
|---|---|
| Estado de aprobación por línea | MODIFIED (estado exclusivo en `time_entry_approvals`) |
| Estado de la semana derivado | **REMOVED** |
| Alcance de aprobación por proyecto del gestor | MODIFIED (por `linea_id`, muta la approval) |
| Bandeja de solicitudes del gestor | MODIFIED (approvals `PENDIENTE` por línea) |
| El seeker no edita lo cargado | *sin cambios* (sigue vigente) |
| Re-carga de un proyecto rechazado | MODIFIED (nueva línea + nueva approval) |
| Auditoría de aprobaciones por línea | MODIFIED (merge approvals+simplify: `reviewed_*`, `comment` unificado, sin `rejection_reason`) |
| Cómputo financiero de horas por línea aprobada | **REMOVED** (renombrado) |
| — | **ADDED** Inmutabilidad de las horas cargadas |
| — | **ADDED** La API no expone estado de semana |
| — | **ADDED** Cómputo de horas efectivas por línea aprobada |

## Decisiones

1. **Headers alineados al canónico actual:** cada `MODIFIED`/`REMOVED` referencia un header que existe hoy, garantizando que el archivado aplique sin abortar.
2. **Rename vía REMOVE + ADD:** "Cómputo financiero…" se elimina y se agrega "Cómputo de horas efectivas…" (no se puede renombrar con `MODIFIED`, que matchea por header).
3. **`can_resubmit` omitido:** no se incluye como `REMOVED` porque nunca estuvo en el canónico (era el delta huérfano que rompía el archivado de simplify). Solo se elimina lo que realmente existe.
4. **Verídico, no replay:** cada afirmación se verificó contra `schema.prisma` y `timeEntries.mapper.ts` (ver Impact del proposal), no solo contra la intención de los changes archivados.

## Nota de aplicación

Este change es spec-only. Para que surta efecto sobre el canónico, debe archivarse **sin** `--skip-specs`. Si el archiver vuelve a fallar por un header, se ajusta el delta (no se fuerza con `--no-validate`).
