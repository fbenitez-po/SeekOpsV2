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

## Stack del proyecto

✅ **Confirmado:**
- Frontend: React
- Backend: Node.js + Express
- Base de datos: PostgreSQL
- Autenticación: JWT

---

## Convenciones

- **Idioma del código:** Español (variables, comentarios, funciones)
- **Idioma de commits:** Español
- **Estilo de nombres:** camelCase (JS/React), snake_case (SQL, env vars)

---

## ⚠️ Regla crítica — Fidelidad visual al preview

**Al generar código de UI, el estilo debe coincidir EXACTAMENTE con los previews aprobados en `.ai/preview/`.**

Esta es una regla no negociable. El preview es el contrato visual firmado. No inventar estilos nuevos ni usar defaults de librerías sin verificar contra el preview.

### Design system confirmado (extraído de los previews):

| Token | Valor | Uso |
|-------|-------|-----|
| Primary | `#0f172a` (slate-900) | Botones, sidebar, links activos, logo |
| Background | `#f8fafc` (slate-50) | Fondo de todas las páginas |
| Card/Section | `#ffffff` | Fondo de cards y secciones |
| Border | `#e2e8f0` (slate-200) | Bordes de cards, inputs, separadores |
| Text principal | `#0f172a` / `#1e293b` | Títulos y texto importante |
| Text secundario | `#64748b` (slate-500) | Labels, subtítulos, placeholders |
| Destructive | `#dc2626` (red-600) | Errores, rechazos |
| Success badge | `bg:#d1fae5 text:#065f46` | Estado APROBADO |
| Warning badge | `bg:#fef3c7 text:#92400e` | Estado PENDIENTE |
| Error badge | `bg:#fee2e2 text:#7f1d1d` | Estado RECHAZADO |
| Muted badge | `bg:#e5e7eb text:#374151` | Estado neutral |
| Font | Inter, 400/500/600/700 | Todo el sistema |
| Border radius card | `0.75rem` | Cards y secciones |
| Border radius input | `0.5rem` | Inputs y botones |
| Input focus ring | `box-shadow: 0 0 0 3px rgba(15,23,42,0.08)` | Focus state |

### Layout confirmado:
- **Sidebar**: fondo `#0f172a`, texto blanco, ancho `224px` (w-56)
- **Contenido**: fondo `#f8fafc`, max-width 6xl, padding `1.5rem`
- **Cards/Sections**: fondo blanco, borde `#e2e8f0`, border-radius `0.75rem`, padding `1.5rem`
- **Login**: gradiente `135deg, #f8fafc → #f1f5f9`, logo box navy con "S" blanca

### Checklist antes de entregar código de UI:
- [ ] Primary color es `#0f172a`, no azul
- [ ] Body background es `#f8fafc`
- [ ] Cards tienen borde `#e2e8f0` y border-radius `0.75rem`
- [ ] Botón primary: `bg #0f172a`, hover `#1e293b`
- [ ] Sidebar dark navy con texto blanco
- [ ] Badges de estado usan los colores exactos de arriba
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

## Decisiones tomadas

> Esta sección crece a medida que avanza el proyecto. Cada decisión importante se anota acá con su justificación.

---

## Estado actual

Ver `.ai/context.md` para el estado detallado del proyecto.
