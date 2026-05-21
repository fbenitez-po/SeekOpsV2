## 1. Esquema y migración (Prisma)

- [ ] 1.1 Agregar a `time_entry_lines` en `backend/prisma/schema.prisma`: `status VARCHAR(50)` default `PENDIENTE`, `reviewed_by VARCHAR(50)?`, `reviewed_at Timestamp?`; índice por `status`.
- [ ] 1.2 Agregar `project_id @db.Uuid?` (nullable) a `time_entry_approvals` con relación a `projects` e índice.
- [ ] 1.3 `prisma migrate dev --name per_project_hours_approval`.
- [ ] 1.4 Backfill en la migración: `UPDATE time_entry_lines tel SET status = te.status FROM time_entries te WHERE tel.time_entry_id = te.id;` y backfill de `project_id` en aprobaciones históricas donde sea derivable.
- [ ] 1.5 Índice parcial único para la regla de re-carga: única línea activa por `(time_entry_id, project_id)` cuando `is_active AND status <> 'RECHAZADO'`.
- [ ] 1.6 Actualizar `.ai/db/schema.md` con las columnas nuevas.

## 2. Backend — repositorio (`timeEntries.repository.ts`)

- [ ] 2.1 Eliminar `findFirstLineProjectId`; agregar helper para obtener `line_ids` activos de un `(entryId, projectId)`.
- [ ] 2.2 Agregar `isProjectManager`/scope: validar que un proyecto sea gestionado por el usuario (ya existe `isProjectManager`).
- [ ] 2.3 Reescribir `recordApproval` para actualizar `status` (+ `reviewed_by`/`reviewed_at`) de las líneas del proyecto indicado, recalcular el rollup de `time_entries.status`, y crear `time_entry_approvals` con `project_id`. Todo en una transacción.
- [ ] 2.4 Agregar helper `computeWeekRollup(lines)` que derive el estado de la semana.
- [ ] 2.5 Cambiar `findExistingEntry` a unicidad `(user, week, project)`; permitir re-carga si la línea previa del proyecto está `RECHAZADO`.
- [ ] 2.6 Ajustar `create` para insertar líneas siempre en `PENDIENTE` y, si la entry de la semana ya existe, agregar líneas a esa entry en vez de crear otra.
- [ ] 2.7 Eliminar `updateLines` (edición de seeker).
- [ ] 2.8 Ajustar `findApprovals` para devolver el `project_id`/proyecto de cada aprobación.
- [ ] 2.9 Ajustar `findAll` para que la bandeja del gestor filtre por líneas `PENDIENTE` de sus proyectos y devuelva las líneas relevantes (o marca de cuáles son del gestor).

## 3. Backend — servicio (`timeEntries.service.ts`)

- [ ] 3.1 Eliminar la rama `isOnlyGestor` y la auto-aprobación en `create`.
- [ ] 3.2 Implementar regla de re-carga por proyecto rechazado en `create`.
- [ ] 3.3 Reescribir `approve` para operar sobre `proyecto_id`: validar manager de cada línea afectada (o ADMIN) y delegar a `recordApproval`.
- [ ] 3.4 Reescribir `observe` igual, restringiendo el ajuste de horas a líneas del proyecto indicado **que estén `PENDIENTE`**.
- [ ] 3.5 Reescribir `reject` igual, con `razon_rechazo`/`permitir_reenvio`.
- [ ] 3.6 Eliminar `adjust`.
- [ ] 3.7 Revisar `getById` para usar el scope por proyecto en la verificación de acceso del gestor (en lugar de la primera línea).

## 4. Backend — schema/rutas/controller/mapper

- [ ] 4.1 `timeEntries.schema.ts`: agregar `proyecto_id` a Approve/Observe/Reject; eliminar `AdjustTimeEntrySchema`.
- [ ] 4.2 `timeEntries.routes.ts`: eliminar `PUT /:id`.
- [ ] 4.3 `timeEntries.controller.ts`: ajustar handlers (quitar `adjust`, pasar `proyecto_id`).
- [ ] 4.4 `timeEntries.mapper.ts`: exponer `estado` por línea, estado-resumen (rollup) de la semana, y proyecto en cada aprobación.

## 5. Backend — finanzas

- [ ] 5.1 En `personnelCosts.repository.ts`, cambiar `horasUsadasFragment` para sumar `tel.hours + tel.extra_hours` `WHERE tel.status IN ('APROBADO','APROBADO_CON_OBSERVACION')` (quitar `te.status='APROBADO'`).

## 6. Frontend — gestor

- [ ] 6.1 Reescribir `HorasEquipo.jsx`: bandeja de **solicitudes** (seeker × semana × proyecto del gestor), agrupando `entrada.lineas` por proyecto y mostrando solo los proyectos del gestor.
- [ ] 6.2 La query de pendientes filtra por líneas pendientes de sus proyectos (no por rollup de semana).
- [ ] 6.3 Botones Aprobar/Aprobar c/obs./Rechazar por solicitud, enviando `proyecto_id`.
- [ ] 6.4 `ModalAprobarConObservacion` muestra y edita solo las líneas del proyecto de la solicitud.

## 7. Frontend — seeker / admin / api

- [ ] 7.1 `MisHoras.jsx`: fila por semana expandible con badge de estado por proyecto; estado-resumen de la semana.
- [ ] 7.2 `HomeSeeker.jsx`: recuentos por estado de línea/proyecto.
- [ ] 7.3 `CargarHoras.jsx`: habilitar re-carga de un proyecto rechazado para una semana.
- [ ] 7.4 Eliminar `AjustarHoras.jsx` y su ruta en `App.jsx`.
- [ ] 7.5 `TodasLasHoras.jsx` (admin): reject/observe por línea/proyecto.
- [ ] 7.6 `services/api.js`: agregar `proyecto_id` a `aprobar/observar/rechazar`; eliminar `ajustar`.

## 8. Consistencia de documentación (regla CLAUDE.md)

- [ ] 8.1 Actualizar historias afectadas (US de seeker/gestor) y conteos en `.ai/stories/` según los cambios de flujo.
- [ ] 8.2 Registrar las decisiones relevantes en `.ai/context.md`.

## 9. Verificación

- [ ] 9.1 Caso: seeker carga 2 proyectos de gestores distintos; cada gestor solo ve y aprueba su solicitud; el otro proyecto sigue pendiente.
- [ ] 9.2 Caso: rechazo de un proyecto → seeker re-carga ese proyecto → nueva línea pendiente; bloqueo si está pendiente/aprobado.
- [ ] 9.3 Caso: finanzas suma horas de líneas `APROBADO` y `APROBADO_CON_OBSERVACION`, no de pendientes/rechazadas.
- [ ] 9.4 `prisma migrate reset` + seed corre limpio; backfill deja líneas con estado coherente.
