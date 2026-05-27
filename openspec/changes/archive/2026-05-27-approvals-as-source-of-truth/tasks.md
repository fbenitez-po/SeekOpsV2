## 1. Schema y migración

- [x] 1.1 En `schema.prisma`, quitar `status` (y `idx_time_entries_status`) de `time_entries`
- [x] 1.2 En `schema.prisma`, quitar `status` (+ índice), `reviewed_by` y `reviewed_at` de `time_entry_lines`; agregar relación inversa `time_entry_approvals[]`
- [x] 1.3 En `schema.prisma`, en `time_entry_approvals`: agregar `time_entry_line_id @db.Uuid` + relación a `time_entry_lines` (`onDelete: Cascade`); renombrar `action`→`status @default("PENDIENTE")`; agregar `reviewed_by`/`reviewed_at`; índices `status`, `time_entry_line_id`
- [x] 1.4 `npx prisma migrate dev --name approvals_as_source_of_truth` y revisar el SQL generado
- [x] 1.5 `npx prisma migrate reset` (recrea + seed) y `npx prisma generate`

## 2. Backend — repository

- [x] 2.1 `create`: usar `createManyAndReturn` para obtener `id` de líneas y, en la misma transacción, crear una approval `PENDIENTE` por línea (`time_entry_line_id`, `project_id`); quitar `status` de las líneas
- [x] 2.2 Eliminar `computeWeekRollup` y `recalculateEntryStatus`; quitar `status` de `findOrCreateEntry`
- [x] 2.3 `recordApproval`: eliminar el bloque que pisa `time_entry_lines` (290-301) y el `updateMany` de status (305-320); eliminar el update de `time_entries.status` (328-331)
- [x] 2.4 `recordApproval`: mutar la approval `PENDIENTE` de la `linea_id` objetivo → estado resultante, seteando `reviewed_by`/`reviewed_at`; en observe `suggested_hours`/`suggested_extra_hours` + `comment`; en reject `rejection_reason`
- [x] 2.5 `findApprovals`: agregar `tea.time_entry_line_id` y `tea.status AS accion` al SELECT
- [x] 2.6 `findAll`: reemplazar filtros por `time_entry_approvals.some({ status, projects:{ manager_id } })` (GESTOR), `user_id` + approvals (SEEKER), approvals sin manager (ADMIN); quitar `where.status`
- [x] 2.7 `findExistingLineForProject`: bloquear si existe línea activa de `(usuario, semana, proyecto, categoría)` con approval ≠ `RECHAZADO`
- [x] 2.8 `getLinesForProject`: devolver el estado desde la approval de la línea (para validar "solo pendientes")
- [x] 2.9 `findSeekersWithLoadData`: reemplazar `te.status != 'RECHAZADO'` por líneas con approval no rechazada

## 3. Backend — service, schema (zod), mapper

- [x] 3.1 `timeEntries.schema.ts`: agregar `linea_id: z.string().uuid()` a Approve/Observe/Reject; quitar `lineas[]` de `ApproveWithObservationSchema`
- [x] 3.2 `service.ts` (`approve`/`observe`/`reject`): validar contra el estado de la approval de la `linea_id` objetivo
- [x] 3.3 `mapper.ts`: eliminar `entrada.estado`; derivar `lineas[].estado` matcheando approval por `time_entry_line_id`; exponer por línea las horas efectivas (observada→sugeridas, aprobada→cargadas) y el estado de la approval
- [x] 3.4 Implementar helper `horasEfectivas(linea, approval)` (observada→sugeridas, aprobada→cargadas, pendiente/rechazada→0) y usarlo en `total_horas`/`total_extras`, reportes y costos de personal

## 4. Frontend

- [x] 4.1 `HorasEquipo.jsx`: en observe enviar `linea_id` y quitar `lineas`; agregar `linea_id` a approve/reject
- [x] 4.2 Quitar el badge de estado de semana (`entrada.estado`) en `MisHoras.jsx`, `MisHorasGestor.jsx`, `HomeGestor.jsx`, `TodasLasHoras.jsx`; ajustar filtros cliente que usan `entrada.estado`/`f.estado` a estado por línea
- [x] 4.3 `HomeGestor.jsx`: derivar el flag de observación desde `entrada.aprobaciones?.find((a) => a.accion === 'APROBADO_CON_OBSERVACION')`
- [x] 4.4 `HomeSeeker.jsx` (Historial Reciente): quitar badge de semana y adoptar el patrón bloque→desplegable de proyectos con estados; incluir `linea_id` en la key de agrupación
- [x] 4.5 `MisHoras.jsx`/`HomeSeeker.jsx`: mostrar por línea las horas efectivas (aprobada→cargadas, observada→sugeridas) con el estado de la approval; opcionalmente mostrar las horas cargadas originales como referencia en observadas

## 5. Documentación

- [x] 5.1 Actualizar `.ai/db/schema.md` (las tres tablas)
- [x] 5.2 Sincronizar `.ai/db/schema.sql` (líneas 300-366) con el nuevo modelo
- [x] 5.3 Registrar la decisión en `.ai/context.md` y actualizar las US de aprobación afectadas

## 6. Verificación

- [x] 6.1 `npm run build` (backend) sin errores de tipos por columnas eliminadas
- [x] 6.2 Carga de proyecto de área con 2 categorías → 2 líneas + 2 approvals `PENDIENTE`
- [x] 6.3 Aprobar-con-observación → `time_entry_lines.hours` NO cambia y la sugerencia queda en `suggested_*`; el seeker ve las horas sugeridas (efectivas) con estado `APROBADO_CON_OBSERVACION`
- [x] 6.4 Rechazar → `RECHAZADO`; re-cargar → nueva línea + approval `PENDIENTE`, la vieja se conserva
- [x] 6.5 Bandeja del gestor y filtro `?estado=` funcionan vía approvals; la respuesta no trae `entrada.estado`
- [x] 6.6 Costos/totales usan horas efectivas (sugeridas en observadas)
