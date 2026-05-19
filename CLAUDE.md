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
| `be-`   | `/be-api-contract`, `/be-api-review`, `/be-error-map`, `/nodejs-backend-patterns`, `/clean-ddd-hexagonal` |
| `fe-`   | `/fe-component-spec`, `/fe-api-integration`, `/fe-ui-states`, `/frontend-design`, `/vercel-react-best-practices` |
| `db-`   | `/db-schema-design`, `/db-migration-write`, `/db-query-review`, `/postgresql-table-design`, `/postgresql-optimization`, `/postgresql-code-review` |
| otros   | `/find-skills` |

Ejemplo:
```
/pm-brief quiero un MVP que permita [descripción de la idea]
```

### Cuándo usarlos automáticamente

**Invocar el skill correspondiente ANTES de responder** en las siguientes situaciones. No esperar a que el usuario lo pida explícitamente.

**Base de datos / PostgreSQL**

| Situación | Skill |
|-----------|-------|
| Diseñar o revisar tablas, columnas, índices o relaciones | `/postgresql-table-design` |
| Escribir o revisar queries SQL (SELECT, JOIN, subqueries, CTEs) | `/postgresql-optimization` |
| Code review de funciones, triggers o procedimientos PG | `/postgresql-code-review` |
| Crear o revisar una migración | `/db-migration-write` |
| Revisar una query puntual | `/db-query-review` |

**Frontend / React**

| Situación | Skill |
|-----------|-------|
| Crear o modificar componentes React o páginas completas | `/frontend-design` |
| Preguntas sobre rendimiento, bundle size o patrones React/Next.js | `/vercel-react-best-practices` |
| Planificar cómo un componente consume un endpoint | `/fe-api-integration` |

**Backend / Node.js**

| Situación | Skill |
|-----------|-------|
| Crear un servidor, endpoint o middleware en Node.js/Express | `/nodejs-backend-patterns` |
| Definir el contrato de un endpoint antes de implementarlo | `/be-api-contract` |
| Revisar la implementación de un endpoint | `/be-api-review` |
| Diseñar arquitectura hexagonal, DDD, capas de dominio, puertos y adaptadores | `/clean-ddd-hexagonal` |

**Discovery**

| Situación | Skill |
|-----------|-------|
| El usuario pregunta si hay un skill para algo | `/find-skills` |
| No está claro qué skill aplica | `/find-skills` |

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

**La fuente de verdad del schema es `backend/prisma/schema.prisma` + `backend/prisma/migrations/`.** Prisma gestiona el ciclo de vida completo del schema desde el refactor del backend (2026-05-19).

### Convenciones del schema (no negociables)

- **Idioma:** todos los identificadores (tablas, columnas, constraints, índices) en **inglés**. Los *valores* de datos pueden quedar en español (contenido de negocio).
- **Auditoría tiered:** bloque estándar al final de cada tabla = `created_at`, `created_by` (`VARCHAR(50)` `DEFAULT 'admin'`), `updated_at` (nullable), `updated_by`, `deleted_at`, `deleted_by`, `is_active`. No todas las tablas llevan el bloque completo (tablas puente, tokens y logs llevan menos).
- **PKs:** UUID `gen_random_uuid()` en entidades; las tablas puente usan **PK compuesta** sin `id` surrogate.

### Workflow de migraciones (Prisma)

| Situación | Acción |
|-----------|--------|
| Nueva BD desde cero | `docker compose up` + `prisma migrate deploy` + `prisma db seed` |
| BD existente con datos | `prisma migrate dev --name <descripcion>` |
| Tests locales | `prisma migrate reset` (borra + migra + seedea) |
| Producción | `prisma migrate deploy` (no interactivo, no resetea) |

### Archivos

- **`backend/prisma/schema.prisma`** — Fuente de verdad del schema. Editar aquí, luego `prisma migrate dev`.
- **`backend/prisma/migrations/`** — Historial de migraciones generadas por Prisma. No editar manualmente.
- **`backend/prisma/seed.ts`** — Datos iniciales (catálogos + usuario admin). Se ejecuta con `prisma db seed` o `prisma migrate reset`.
- **`.ai/db/schema.sql`** — Referencia histórica del DDL original (bootstrap de la migración inicial `0_init`). Solo lectura.
- **`.ai/db/data.sql`** — Origen de los datos iniciales, trasladado a `prisma/seed.ts`. Solo referencia.
- **`.ai/db/schema.md`** — Documentación del schema. Mantener actualizada cuando cambie `schema.prisma`.

### Cómo agregar un cambio de schema

1. Editar `backend/prisma/schema.prisma` con el cambio deseado
2. Ejecutar `prisma migrate dev --name <descripcion>` — Prisma genera el SQL y aplica
3. Actualizar `.ai/db/schema.md` con la tabla/columna afectada

**Nunca** modificar los archivos de migración generados ni aplicar SQL directo a la BD sin registrarlo en Prisma.

---

## Estado actual

Ver `.ai/context.md` para el estado detallado del proyecto.
