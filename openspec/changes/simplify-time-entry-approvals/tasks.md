## 1. Schema de base de datos (Prisma)

- [x] 1.1 Editar `backend/prisma/schema.prisma`: eliminar campo `rejection_reason` de `time_entry_approvals`
- [x] 1.2 Editar `backend/prisma/schema.prisma`: eliminar campo `can_resubmit` de `time_entry_approvals`
- [x] 1.3 Editar `backend/prisma/schema.prisma`: eliminar campo `project_id` de `time_entry_approvals`
- [x] 1.4 Editar `backend/prisma/schema.prisma`: eliminar relación `projects projects?` de `time_entry_approvals` y `time_entry_approvals time_entry_approvals[]` de `projects`
- [x] 1.5 Ejecutar `prisma migrate dev --name simplify-time-entry-approvals` y verificar que genera `DROP COLUMN` × 3 + `DROP INDEX`

## 2. Backend — Repository

- [x] 2.1 En `timeEntries.repository.ts`, actualizar interface `ApprovalRow`: quitar campos `razon_rechazo` y `permitir_reenvio`
- [x] 2.2 En `timeEntries.repository.ts`, función `findApprovals()`: eliminar `tea.rejection_reason AS razon_rechazo` y `tea.can_resubmit AS permitir_reenvio` del SELECT del raw SQL
- [x] 2.3 En `timeEntries.repository.ts`, función `findApprovals()`: cambiar `LEFT JOIN projects p ON p.id = tea.project_id` por `JOIN projects p ON p.id = tel.project_id`
- [x] 2.4 En `timeEntries.repository.ts`, función `create()`: eliminar `project_id: line.project_id` del `createMany` de `time_entry_approvals`
- [x] 2.5 En `timeEntries.repository.ts`, función `recordApproval()`: eliminar `rejection_reason` y `can_resubmit` del objeto `data` del `update`
- [x] 2.6 En `timeEntries.repository.ts`, función `recordApproval()`: verificar que el parámetro `projectId` se sigue usando para validación (no se almacena en la tabla)

## 3. Backend — Schema de validación y servicio

- [x] 3.1 En `timeEntries.schema.ts`, eliminar `permitir_reenvio: z.boolean().optional()` de `RejectSchema`
- [x] 3.2 En `timeEntries.schema.ts`, eliminar `permitir_reenvio` del tipo exportado `RejectInput`
- [x] 3.3 En `timeEntries.service.ts`, función `reject()`: eliminar `permitir_reenvio: body.permitir_reenvio ?? false` de la respuesta retornada

## 4. Backend — Mapper

- [x] 4.1 En `timeEntries.mapper.ts`, función `buildTimeEntryDetail()`: eliminar el campo `proyecto` del objeto mapeado dentro de `aprobaciones`

## 5. Frontend

- [x] 5.1 En `frontend/src/pages/gestor/HorasEquipo.jsx`: eliminar `permitir_reenvio: true` del payload enviado al endpoint de rechazo (línea ~136)
- [x] 5.2 En `frontend/src/pages/admin/TodasLasHoras.jsx`: eliminar `permitir_reenvio: true` del payload enviado al endpoint de rechazo (línea ~100)

## 6. Documentación

- [x] 6.1 En `.ai/db/schema.md`: eliminar las 3 columnas del DDL de ejemplo de `time_entry_approvals` y actualizar la nota de decisión de diseño
- [x] 6.2 En `.ai/db/schema.sql`: eliminar `rejection_reason`, `can_resubmit`, `project_id` y el índice `idx_time_entry_approvals_project_id` de la definición de `time_entry_approvals`
- [x] 6.3 En `.ai/db/migration-seekops-old/migration_plan.md`: en el Paso 7, eliminar `project_id` de la tabla de mapeo de campos de `time_entry_approvals`
- [x] 6.4 En `.ai/db/migration-seekops-old/migrate_seekops_old.sql`: eliminar `project_id` del INSERT de `time_entry_approvals` en la sección del Paso 7
