## Why

La tabla `time_entry_approvals` acumuló tres columnas redundantes durante el diseño iterativo: `rejection_reason` duplica lo que ya se guarda en `comment`, `can_resubmit` no controla ninguna lógica real (el re-envío se determina por el estado `RECHAZADO`), y `project_id` es alcanzable vía `time_entry_line_id → time_entry_lines.project_id`. Eliminarlas reduce la superficie de la tabla y elimina lógica muerta en backend y frontend.

## What Changes

- **BREAKING** Eliminar columna `time_entry_approvals.rejection_reason`: la razón de rechazo se consolida en `comment` (ya se guarda ahí hoy).
- **BREAKING** Eliminar columna `time_entry_approvals.can_resubmit`: el permiso de re-envío lo define el estado `RECHAZADO`, no este campo. Ninguna query lo consulta; en el frontend siempre estaba hardcodeado en `true`.
- **BREAKING** Eliminar columna `time_entry_approvals.project_id` y su índice `idx_time_entry_approvals_project_id`: el proyecto es alcanzable vía `time_entry_lines.project_id`. Ninguna query filtra approvals por este campo.
- Quitar `permitir_reenvio` del schema de validación de rechazo (`RejectSchema`) y de la respuesta del servicio.
- Quitar campo `proyecto` de la respuesta de `aprobaciones` en el mapper (no se consume en el frontend).
- Actualizar la query raw `findApprovals` para obtener el nombre del proyecto vía `tel.project_id` en lugar de `tea.project_id`.
- Actualizar documentación: `schema.md`, `schema.sql`, `migration_plan.md`, `migrate_seekops_old.sql`.

## Capabilities

### New Capabilities
- ninguna

### Modified Capabilities
- `hours-approval`: el contrato de rechazo elimina el campo `permitir_reenvio` del request; la respuesta de `aprobaciones` elimina el objeto `proyecto`.

## Impact

- **Backend**: `schema.prisma`, `timeEntries.repository.ts`, `timeEntries.schema.ts`, `timeEntries.service.ts`, `timeEntries.mapper.ts`
- **Frontend**: `HorasEquipo.jsx`, `TodasLasHoras.jsx` (payloads de rechazo)
- **Migración Prisma**: nueva migración `DROP COLUMN` × 3 + `DROP INDEX`
- **Documentación**: `schema.md`, `schema.sql`, `migration-seekops-old/migration_plan.md`, `migrate_seekops_old.sql`
- Sin cambios en contratos de creación, aprobación o aprobación con observación.
