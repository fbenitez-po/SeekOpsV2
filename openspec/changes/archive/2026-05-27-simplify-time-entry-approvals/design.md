## Context

`time_entry_approvals` es la fuente de verdad del estado de revisión de horas. Una fila por `time_entry_line` (1:1 UNIQUE), creada en `PENDIENTE` al cargar el seeker, mutada por el gestor.

**Estado actual de las tres columnas a eliminar:**

| Columna | Problema |
|---------|----------|
| `rejection_reason TEXT` | Duplica `comment`. En `recordApproval()`, ya hoy se guarda `rejectData.razon_rechazo` en ambos campos (`comment` y `rejection_reason`). El mapper nunca expone `rejection_reason` en la respuesta API. |
| `can_resubmit BOOLEAN DEFAULT false` | Nunca controla lógica. `findExistingLineForProject` decide re-envío con `if (status === 'RECHAZADO') return null` — sin leer este campo. En los dos únicos puntos del frontend donde se envía, siempre va hardcodeado en `true`. |
| `project_id UUID` | Redundante. Cada `time_entry_approvals` tiene `time_entry_line_id UNIQUE`, y esa línea tiene `project_id`. La única query que usa `tea.project_id` es la raw SQL de `findApprovals`, para un JOIN que puede reescribirse trivialmente via `tel.project_id`. Ningún filtro activo en la BD usa el índice `idx_time_entry_approvals_project_id`. |

**Flujo de re-envío:** Al rechazar, el seeker puede recargar porque `findExistingLineForProject` retorna `null` para líneas `RECHAZADO`. La lógica no depende de `can_resubmit` — el estado es suficiente.

## Goals / Non-Goals

**Goals:**
- Eliminar las 3 columnas de `time_entry_approvals` sin pérdida de información ni cambio de comportamiento observable.
- Limpiar el código backend (repo, schema, servicio, mapper) y frontend de referencias a campos eliminados.
- Mantener el campo `comment` como portador unificado del texto libre del gestor (observación o motivo de rechazo).
- Actualizar documentación de referencia (`schema.md`, `schema.sql`, script de migración legacy).

**Non-Goals:**
- No cambiar el comportamiento de ningún flujo de aprobaciones.
- No modificar endpoints ni contratos HTTP (salvo eliminar `permitir_reenvio` del body de rechazo y del objeto `aprobaciones` en la respuesta).
- No migrar datos históricos — las columnas se eliminan directamente (sin backfill necesario: `comment` ya contiene la información relevante de `rejection_reason`).

## Decisions

### D1: `comment` como campo unificado para texto del gestor
El campo `comment` ya acumula hoy: observación en `APROBADO_CON_OBSERVACION` y razón de rechazo en `RECHAZADO`. Se mantiene semántica: si `status = RECHAZADO`, `comment` es el motivo de rechazo. No se agrega columna nueva ni se renombra `comment`.

**Alternativa descartada:** Renombrar `comment` a `manager_note`. Introduce un rename innecesario y requeriría migración de datos + actualizar todos los alias en queries raw.

### D2: Re-envío determinado solo por estado
El permiso de re-envío se infiere del estado `RECHAZADO`. No se agrega ningún campo alternativo.

**Alternativa descartada:** Mantener `can_resubmit` pero siempre en `true`. Añade ruido sin valor.

### D3: JOIN de proyecto en `findApprovals` via `tel.project_id`
La query raw `findApprovals` actualmente hace `LEFT JOIN projects p ON p.id = tea.project_id`. Se reescribe como `JOIN projects p ON p.id = tel.project_id` (el JOIN a `tel` ya existe en la misma query). Sin cambio de resultado.

**Alternativa descartada:** Eliminar `proyecto` del response de `aprobaciones`. Es posible (el frontend no lo usa hoy), pero mantenerlo no cuesta nada y es información útil para futuros consumidores.

### D4: Migración Prisma con `migrate dev`
Se genera una migración con `prisma migrate dev --name simplify-time-entry-approvals`. Prisma genera el SQL de `DROP COLUMN` y `DROP INDEX` automáticamente a partir del diff del schema.

**No hay riesgo de pérdida de datos** porque:
- `rejection_reason` → su información ya está en `comment`
- `can_resubmit` → no tenía valor semántico real
- `project_id` → alcanzable vía join

## Risks / Trade-offs

- **[Risk] Consumidores externos de la API leen `razon_rechazo` del objeto aprobación** → El mapper nunca expuso `razon_rechazo` ni `permitir_reenvio` en la respuesta (el mapper solo expone `comentario`). El único cambio visible en la API es la desaparición de `permitir_reenvio` del body de respuesta de `POST /reject` y del objeto `aprobaciones`. El frontend está auditado y no los consume. Mitigación: documentar en el change log del API.

- **[Risk] El script de migración legacy `migrate_seekops_old.sql` inserta `project_id` en `time_entry_approvals`** → Si se re-ejecuta el Paso 7 después de aplicar esta migración, fallará. Mitigación: actualizar el script para quitar esa columna del INSERT.

- **[Trade-off] `proyecto` en respuesta de `aprobaciones` se mantiene** → Se obtiene via JOIN `tel.project_id → projects` en lugar de `tea.project_id`. Costo: join extra en `findApprovals`. Beneficio: información de proyecto disponible si se necesita en el futuro.

## Migration Plan

1. Editar `backend/prisma/schema.prisma`: quitar campos y relación.
2. Ejecutar `prisma migrate dev --name simplify-time-entry-approvals` — genera SQL de DROP COLUMN × 3 + DROP INDEX.
3. Actualizar código backend (repo, schema, servicio, mapper).
4. Actualizar frontend (dos payloads de rechazo).
5. Actualizar documentación (`schema.md`, `schema.sql`, `migration_plan.md`, `migrate_seekops_old.sql`).

**Rollback:** Revertir la migración con `prisma migrate resolve --rolled-back` + restaurar los archivos de código. Los datos eliminados no son recuperables, pero ninguna columna tenía información que no esté en otro campo.
