## 1. Esquema y migración (Prisma)

- [x] 1.1 Agregar a `time_entry_lines` en `backend/prisma/schema.prisma`: `status VARCHAR(50)` default `PENDIENTE`, `reviewed_by VARCHAR(50)?`, `reviewed_at Timestamp?`; índice por `status`.
- [x] 1.2 Agregar `project_id @db.Uuid?` (nullable) a `time_entry_approvals` con relación a `projects` e índice.
- [x] 1.3 `prisma migrate dev --name per_project_hours_approval`.
- [x] 1.4 Backfill en la migración: `UPDATE time_entry_lines tel SET status = te.status FROM time_entries te WHERE tel.time_entry_id = te.id;` y backfill de `project_id` en aprobaciones históricas donde sea derivable.
- [x] 1.5 Índice parcial único para la regla de re-carga: única línea activa por `(time_entry_id, project_id)` cuando `is_active AND status <> 'RECHAZADO'`.
- [x] 1.6 Actualizar `.ai/db/schema.md` con las columnas nuevas.

## 2. Backend — repositorio (`timeEntries.repository.ts`)

- [x] 2.1 Eliminar `findFirstLineProjectId`; agregar helper para obtener `line_ids` activos de un `(entryId, projectId)`.
- [x] 2.2 Agregar `isProjectManager`/scope: validar que un proyecto sea gestionado por el usuario (ya existe `isProjectManager`).
- [x] 2.3 Reescribir `recordApproval` para actualizar `status` (+ `reviewed_by`/`reviewed_at`) de las líneas del proyecto indicado, recalcular el rollup de `time_entries.status`, y crear `time_entry_approvals` con `project_id`. Todo en una transacción.
- [x] 2.4 Agregar helper `computeWeekRollup(lines)` que derive el estado de la semana.
- [x] 2.5 Cambiar `findExistingEntry` a unicidad `(user, week, project)`; permitir re-carga si la línea previa del proyecto está `RECHAZADO`.
- [x] 2.6 Ajustar `create` para insertar líneas siempre en `PENDIENTE` y, si la entry de la semana ya existe, agregar líneas a esa entry en vez de crear otra.
- [x] 2.7 Eliminar `updateLines` (edición de seeker).
- [x] 2.8 Ajustar `findApprovals` para devolver el `project_id`/proyecto de cada aprobación.
- [x] 2.9 Ajustar `findAll` para que la bandeja del gestor filtre por líneas `PENDIENTE` de sus proyectos y devuelva las líneas relevantes (o marca de cuáles son del gestor).

## 3. Backend — servicio (`timeEntries.service.ts`)

- [x] 3.1 Eliminar la rama `isOnlyGestor` y la auto-aprobación en `create`.
- [x] 3.2 Implementar regla de re-carga por proyecto rechazado en `create`.
- [x] 3.3 Reescribir `approve` para operar sobre `proyecto_id`: validar manager de cada línea afectada (o ADMIN) y delegar a `recordApproval`.
- [x] 3.4 Reescribir `observe` igual, restringiendo el ajuste de horas a líneas del proyecto indicado **que estén `PENDIENTE`**.
- [x] 3.5 Reescribir `reject` igual, con `razon_rechazo`/`permitir_reenvio`.
- [x] 3.6 Eliminar `adjust`.
- [x] 3.7 Revisar `getById` para usar el scope por proyecto en la verificación de acceso del gestor (en lugar de la primera línea).

## 4. Backend — schema/rutas/controller/mapper

- [x] 4.1 `timeEntries.schema.ts`: agregar `proyecto_id` a Approve/Observe/Reject; eliminar `AdjustTimeEntrySchema`.
- [x] 4.2 `timeEntries.routes.ts`: eliminar `PUT /:id`.
- [x] 4.3 `timeEntries.controller.ts`: ajustar handlers (quitar `adjust`, pasar `proyecto_id`).
- [x] 4.4 `timeEntries.mapper.ts`: exponer `estado` por línea, estado-resumen (rollup) de la semana, y proyecto en cada aprobación.

## 5. Backend — finanzas

- [x] 5.1 En `personnelCosts.repository.ts`, cambiar `horasUsadasFragment` para sumar `tel.hours + tel.extra_hours` `WHERE tel.status IN ('APROBADO','APROBADO_CON_OBSERVACION')` (quitar `te.status='APROBADO'`).

## 6. Frontend — gestor

- [x] 6.1 Reescribir `HorasEquipo.jsx`: bandeja de **solicitudes** (seeker × semana × proyecto del gestor), agrupando `entrada.lineas` por proyecto y mostrando solo los proyectos del gestor.
- [x] 6.2 La query de pendientes filtra por líneas pendientes de sus proyectos (no por rollup de semana).
- [x] 6.3 Botones Aprobar/Aprobar c/obs./Rechazar por solicitud, enviando `proyecto_id`.
- [x] 6.4 `ModalAprobarConObservacion` muestra y edita solo las líneas del proyecto de la solicitud.

## 7. Frontend — seeker / admin / api

- [x] 7.1 `MisHoras.jsx`: fila por semana expandible con badge de estado por proyecto; estado-resumen de la semana.
- [x] 7.2 `HomeSeeker.jsx`: recuentos por estado de línea/proyecto.
- [x] 7.3 `CargarHoras.jsx`: habilitar re-carga de un proyecto rechazado para una semana.
- [x] 7.4 Eliminar `AjustarHoras.jsx` y su ruta en `App.jsx`.
- [x] 7.5 `TodasLasHoras.jsx` (admin): reject/observe por línea/proyecto.
- [x] 7.6 `services/api.js`: agregar `proyecto_id` a `aprobar/observar/rechazar`; eliminar `ajustar`.

## 8. Consistencia de documentación (regla CLAUDE.md)

- [x] 8.1 Actualizar historias afectadas (US de seeker/gestor) y conteos en `.ai/stories/` según los cambios de flujo.
- [x] 8.2 Registrar las decisiones relevantes en `.ai/context.md`.

## 9. Verificación

- [ ] 9.1 Caso: seeker carga 2 proyectos de gestores distintos; cada gestor solo ve y aprueba su solicitud; el otro proyecto sigue pendiente.
- [ ] 9.2 Caso: rechazo de un proyecto → seeker re-carga ese proyecto → nueva línea pendiente; bloqueo si está pendiente/aprobado.
- [ ] 9.3 Caso: finanzas suma horas de líneas `APROBADO` y `APROBADO_CON_OBSERVACION`, no de pendientes/rechazadas.
- [ ] 9.4 `prisma migrate reset` + seed corre limpio; backfill deja líneas con estado coherente.
