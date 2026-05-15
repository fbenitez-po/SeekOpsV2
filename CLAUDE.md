# CLAUDE.md — Seekops

## Instrucción principal

Al inicio de cada sesión, ejecutar `/pm-session-start`. Ese skill lee `.ai/context.md`, resume el estado y propone el próximo paso.

---

## Sobre este archivo

Este CLAUDE.md se va alimentando a lo largo del desarrollo. Cada vez que se toma una decisión importante, se documenta aquí o en `.ai/context.md`. No inventar contexto que no esté escrito.

## Regla crítica — mantenimiento del contexto

`.ai/context.md` es la fuente de verdad del proyecto. **Debe actualizarse cada vez que se toma una decisión relevante**, incluyendo:
- Decisiones de arquitectura o diseño
- Decisiones de UX (comportamientos, estados, flujos resueltos)
- Decisiones de base de datos
- Cambios en el stack o en el formato de datos
- Cualquier "lo dejamos para después" que defina un límite del MVP

Si al final de una sesión de trabajo hay decisiones tomadas que no están en `.ai/context.md`, el contexto está desactualizado. Actualizarlo es parte del trabajo, no un extra.

## Regla crítica — consistencia de historias de usuario

Cuando se toma una decisión funcional que afecta campos, flujos o comportamientos ya definidos en las historias, **las stories deben actualizarse en la misma sesión**, no después. Esto incluye:
- Agregar o eliminar campos de una entidad (ej: se elimina `nombre` de clientes → actualizar US-010, US-014)
- Cambiar el comportamiento de un flujo (ej: auto-aprobación del gestor → actualizar US-008)
- Agregar una historia nueva → actualizar `README.md` del stories con el ID correcto y el conteo total
- Renombrar o reasignar IDs para evitar conflictos entre epics

**Checklist al tomar una decisión funcional:**
1. ¿Afecta campos de alguna entidad? → actualizar las US que mencionan esos campos
2. ¿Cambia un flujo o comportamiento? → actualizar criterios de aceptación de las US afectadas
3. ¿Es una historia nueva? → asignar ID único, agregar al epic correspondiente y al README
4. ¿Cambia el total de historias? → actualizar el conteo en README y en `context.md`


---

## Cómo trabajar en este proyecto

- Leer siempre el contexto antes de proponer cambios.
- Preguntar si algo no está claro antes de asumir.
- No agregar funcionalidades no pedidas.
- No crear archivos innecesarios.
- Preferir editar archivos existentes antes de crear nuevos.

## Flujo de trabajo

El pipeline de etapas y el detalle de cada paso están en `.ai/context.md`.

**10 etapas (en orden):**
1. Brief
2. Stories
3. UX flows
4. UX screens
5. Preview UX
6. **Specification Summary** ← consolidación centralizada de campos y validaciones
7. Resolver pendientes
8. DB schema
9. API contracts + Mocks
10. Código

Ver `WORKFLOW.md` para el checklist completo de cada etapa.

---

## Skills disponibles

Los skills están en `.claude/skills/` y se invocan directamente:

| Prefijo | Skills |
|---------|--------|
| `pm-`   | `/pm-session-start`, `/pm-brief`, `/pm-story`, `/pm-prioritize`, `/pm-risks` |
| `ux-`   | `/ux-screen-spec`, `/ux-user-flow`, `/ux-design-review` |
| `qa-`   | `/qa-test-plan` |
| `be-`   | `/be-api-contract`, `/be-api-review`, `/be-error-map` |
| `fe-`   | `/fe-component-spec`, `/fe-api-integration`, `/fe-ui-states` |
| `db-`   | `/db-schema-design`, `/db-migration-write`, `/db-query-review` |

Ejemplo:
```
/pm-brief quiero un MVP que permita [descripción de la idea]
```

---

## Convenciones

Las convenciones de idioma, copy y estilo de nombres están en `.ai/context.md` → sección "Convenciones".

---

## ⚠️ Regla crítica — Fidelidad visual al preview

**Al generar código de UI, el estilo debe coincidir EXACTAMENTE con los previews aprobados en `.ai/preview/`.**

Esta es una regla no negociable. El preview es el contrato visual firmado. No inventar estilos nuevos ni usar defaults de librerías sin verificar contra el preview.

Los tokens exactos (colores, tipografía, layout, badges) están en `.ai/context.md` → sección "Design System".

### Checklist antes de entregar código de UI:
- [ ] Primary color es `#0f172a`, no azul
- [ ] Body background es `#f8fafc`
- [ ] Cards tienen borde `#e2e8f0` y border-radius `0.75rem`
- [ ] Botón primary: `bg #0f172a`, hover `#1e293b`
- [ ] Sidebar dark navy con texto blanco
- [ ] Badges de estado usan los colores de context.md → Design System
- [ ] Font Inter cargada vía Google Fonts

---

## ⚠️ Regla crítica — Base de datos

**La fuente de verdad del schema es `.ai/db/setup_schema.sql`.** Siempre refleja el estado completo y final de todas las tablas, índices y constraints.

### Convención de migraciones

| Situación | Acción |
|-----------|--------|
| Nueva BD desde cero | `setup_schema.sql` + `setup_seeds.sql` |
| BD existente con datos | Aplicar solo la migración incremental |
| Después de cualquier cambio de schema | Actualizar `setup_schema.sql` Y `schema.md` |

### Archivos

- **`.ai/db/setup_schema.sql`** — DDL completo (todas las tablas). Siempre actualizado.
- **`.ai/db/setup_seeds.sql`** — Seeds iniciales.
- **`.ai/db/schema.md`** — Documentación del schema. Debe coincidir con `setup_schema.sql`.
- **`.ai/db/migrations_archive/`** — Migraciones incrementales (001 en adelante). Aquí van todas las migraciones futuras.

### Cómo agregar un cambio de schema

1. Crear `.ai/db/migrations_archive/NNN_nombre_descriptivo.sql` (solo el delta: ALTER, CREATE, etc.)
2. Actualizar `.ai/db/setup_schema.sql` incorporando el cambio
3. Actualizar `.ai/db/schema.md` con la tabla/columna afectada

**Nunca** modificar `setup_schema.sql` sin crear primero la migración correspondiente si la BD ya tiene datos.

---

## Estado actual

Ver `.ai/context.md` para el estado detallado del proyecto.
