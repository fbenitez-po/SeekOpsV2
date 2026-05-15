# Pendientes — Decisiones bloqueantes

> Decidir antes de avanzar a API + Código.
> Las decisiones aquí bloquean desarrollo porque afectan API, DB, flujos o validaciones.

---

## Abiertos

| ID | Tema | Bloquea | Estado |
|---|---|---|---|

---

## Cerrados

| ID | Tema | Decisión | Fecha |
|---|---|---|---|
| P-001 | Período para cargar horas retroactivas | Sin límite máximo — puede cargar cualquier semana | 2026-04-23 |
| P-002 | Auditoria de cambios en horas | Sí — se registra quién cambió qué y cuándo | 2026-04-23 |
| P-003 | Sistema de notificaciones | Email automático en eventos clave (aprobación, observación, ajustes) | 2026-04-23 |
| P-004 | ¿Se puede desaprobar horas? | No — aprobación es definitiva. Rechazo es la opción si hay error | 2026-04-23 |
| P-005 | Flujo de aprobación para gestor que carga horas | Se auto-aprueba (porque es el gestor del proyecto) | 2026-04-23 |
| P-006 | Manejo de horas rechazadas | Se visualizan sin opción de editar. Nueva carga requiere crear entrada nueva | 2026-04-23 |
| P-007 | Modelo de asignación usuario-proyecto-rol | Múltiples roles permitidos — un usuario puede ser Seeker en Proyecto A, Gestor en B, o ambos en C | 2026-04-23 |
| P-008 | Integración de email | Requerida para notificaciones — definir SMTP/templates en etapa de código | 2026-04-23 |

---

## Mejoras técnicas pendientes de ejecución

> Mejoras identificadas en revisión del schema. No bloquean lo que ya está funcionando, pero deben ejecutarse antes de ir a producción.

---

### 🔴 Críticos

### #1 — `refresh_tokens` y `password_reset_tokens` con UNIQUE en `user_id`
Un solo token por usuario en toda la tabla. Impide múltiples sesiones o dispositivos activos simultáneamente. Si alguien hace login desde el celular y la PC, el primero queda invalidado.

### #2 — `time_entries` sin UNIQUE(user_id, semana)
Un usuario puede tener múltiples registros de tiempo para la misma semana. Roto por diseño si el flujo espera uno solo.

### #3 — `time_entries.estado` y `time_entry_approvals.action` sin CHECK constraint
Son `VARCHAR(50)` libres. La BD acepta cualquier valor, incluyendo typos. Los estados válidos (`PENDIENTE`, `ENVIADO`, `APROBADO`, etc.) deberían estar restringidos.

### #4 — `time_entry_lines.hours` permite 0
El CHECK es `hours >= 0`. Se puede guardar una línea con 0 horas, que no tiene sentido de negocio.

---

### 🟡 Importantes

### #5 — Inconsistencia de idioma en nombres de columna
Algunas tablas usan `name` (inglés) y otras usan `nombre` (español). Tablas afectadas: `service_types`, `client_segmentations`, `client_sectors`, `project_segmentation`, `project_categories`, `productivity_layers`.
**Avance:** Convención documentada en `context.md` ✅ — pendiente normalizar columnas en el schema.
**Decisión:** Renombrar `nombre` → `name` en las tablas afectadas.

### #6 — Inconsistencia en columnas de auditoría
La mitad de las tablas usa `created_by` / `updated_by` (clients, projects, registros_comerciales), la otra mitad usa `created_by_user_id` / `updated_by_user_id` (time_entries, ingresos, gastos_admin, etc.). Complica las queries.
**Decisión:** Estandarizar en todas las tablas el siguiente conjunto de columnas de auditoría:
- `created_at` — timestamp de creación
- `created_by` — email del usuario que creó el registro (`VARCHAR(255)`, no FK)
- `updated_at` — timestamp de última modificación
- `updated_by` — email del usuario que modificó (`VARCHAR(255)`, no FK)
- `enabled` — baja lógica (`BOOLEAN NOT NULL DEFAULT true`), reemplaza `activo`
- `deleted_at` — timestamp de baja (solo en tablas con baja lógica)
- `deleted_by` — email del usuario que dio de baja (`VARCHAR(255)`, no FK, solo en tablas con baja lógica)

### #7 — `TIMESTAMP` sin timezone ⭐ superdeseable
Todos los timestamps son `TIMESTAMP` (sin timezone). En un sistema con usuarios o servidores en distintas zonas horarias, los valores son ambiguos. Debería ser `TIMESTAMPTZ`.
**Nota:** No se ejecuta en esta etapa.

### #8 — `updated_at` debe setearse desde el BE
`updated_at` no es responsabilidad de la BD — se setea desde el backend en cada operación de escritura.
**Decisión:** No se usa trigger. Es responsabilidad del BE.
**Revisión realizada:** 14 UPDATE relevados. 12 correctos ✅. 2 faltantes ⚠️:
- `timeEntryData.js` ~línea 178 — `actualizarSoloHorasLineas()` sobre `time_entry_lines`
- `timeEntryData.js` ~línea 191 — `actualizarLineasEntrada()` sobre `time_entry_lines`

### #9 — `hour_projections.categoria_id` referencia `client_categories`
El nombre es confuso: `categoria_id` apunta a categorías de cliente, no del proyecto. Semánticamente poco claro por qué una proyección de horas necesita la categoría del cliente.

### #10 — `projects` sin campo `status`
Solo tiene `activo` (boolean). No hay forma de distinguir un proyecto en propuesta, en ejecución, pausado o terminado.

### #11 — `registros_comerciales.estado_contrato` y `facturacion` son BOOLEAN
Un contrato puede estar en revisión, firmado, vencido, etc. No cabe en true/false. Idem facturación.

---

### 🟢 Menores

### #12 — `project_users.rol` sin restricción
`VARCHAR(50)` libre. Los roles válidos del sistema no están definidos en la BD.

### #13 — `moneda` en `registros_comerciales` sin CHECK
Acepta cualquier string de 3 caracteres. Debería restringirse a los valores válidos (`PEN`, `USD`, `EUR`).

### #14 — `gastos_admin.codigo` y `costos_venta.codigo` sin UNIQUE por periodo
El mismo código puede repetirse en el mismo periodo sin protección.

### #15 — `clients` sin índice en `client_category_id`
Hay FK pero no índice. Queries que filtren por categoría de cliente hacen full scan.

### #16 — `users.password_hash DEFAULT '$placeholder$'`
Permite insertar usuarios sin password real. Si no se valida en la aplicación, quedan con ese valor como acceso.

### #17 — Seeds mezclados en el DDL
Los `INSERT` de `periodos` y `tipos_documento` están dentro del schema DDL. Si se re-ejecuta el schema (ej. en tests), los seeds se duplican o fallan. Deberían estar solo en `setup_seeds.sql`.

### #18 — `time_entry_lines` sin UNIQUE(time_entry_id, project_id)
Permite múltiples líneas del mismo proyecto en el mismo time entry. Confirmar si es intencional.

---

## Notas

- ✅ Todas las decisiones críticas están cerradas
- El email se implementa en etapa de código (no bloquea desarrollo de lógica)
- Actualizado `context.md` y historias con estas decisiones

---

