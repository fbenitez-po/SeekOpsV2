## 1. Verificación contra el código (spec verídico)

- [x] 1.1 `schema.prisma`: confirmar que `time_entries` y `time_entry_lines` no tienen columna `status`
- [x] 1.2 `schema.prisma`: confirmar `time_entry_approvals` con `status`/`comment`/`suggested_*`/`reviewed_by`/`reviewed_at` y SIN `rejection_reason`
- [x] 1.3 `timeEntries.mapper.ts`: confirmar que la entrada no expone `estado` de semana y que `estado`/`horas_efectivas` se derivan por línea desde la approval

## 2. Delta de reconciliación (headers alineados al canónico)

- [x] 2.1 MODIFIED de los 5 requirements vigentes (Estado por línea, Alcance, Bandeja, Re-carga, Auditoría) con el cuerpo actualizado
- [x] 2.2 ADDED de "Inmutabilidad de las horas cargadas", "La API no expone estado de semana" y "Cómputo de horas efectivas por línea aprobada"
- [x] 2.3 REMOVED de "Estado de la semana derivado" y "Cómputo financiero de horas por línea aprobada"; `can_resubmit` omitido (nunca estuvo en el canónico)

## 3. Aplicación

- [x] 3.1 `openspec validate reconcile-hours-approval-spec --strict` sin errores
- [x] 3.2 El canónico estaba en formato legacy (sin `## Requirements` → el parser contaba 0 requirements y todo `MODIFIED`/`REMOVED` fallaba). Se reparó `openspec/specs/hours-approval/spec.md` directamente al formato actual con el contenido reconciliado (ahora parsea 9 requirements y valida ✓), y el change se archiva con `--skip-specs`. No se usó `--no-validate`.
