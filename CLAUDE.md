# CLAUDE.md — Seekops

## Instrucción principal

Al inicio de cada sesión, **leer `docs/context.md`** (fuente de verdad del proyecto): resume el estado actual antes de proponer cualquier cambio. El historial cronológico de decisiones está en `docs/decisions.md`.

## Cómo trabajar en este proyecto

- Leer el contexto antes de proponer cambios. Preguntar si algo no está claro en vez de asumir.
- No agregar funcionalidades no pedidas. No crear archivos innecesarios. Preferir editar archivos existentes.
- No inventar contexto que no esté escrito.
- **Flujo de construcción:** `Story → Schema → API → Código`. **No hay funcionalidad sin historia de usuario:** toda tabla, endpoint, pantalla o lógica nueva debe tener su US antes o en el mismo cambio. Si aparece código/schema sin story, se escribe la story de inmediato.

---

## Estructura del repo

| Carpeta | Contenido |
|---------|-----------|
| `apps/api/` | API Node + Express + TypeScript + Prisma. Código en `src/modules/<dominio>/` y `src/shared/`. Schema y migraciones en `apps/api/prisma/`. |
| `apps/ui/` | App React + Vite + shadcn/ui + Tailwind. |
| `docs/` | Documentación: `context.md` (fuente de verdad), `decisions.md`, `brief.md`, `stories/`, `ux/`, `preview/`, `api/`, `db/`, `postman/`. |
| `docs/db/` | Espejos SQL: `schema.sql`, `seeds.sql`, `schema.md`, `legacy-migration/`. |
| `docs/postman/` | Colección Postman de la API. |
| `openspec/` | Cambios dirigidos por especificación (skills `openspec-*`). |

## Comandos

**Levantar todo en local:** `docker compose up` (postgres + backend + frontend).

**Backend** (en `apps/api/`):
| Acción | Comando |
|--------|---------|
| Dev (watch) | `npm run dev` |
| Build | `npm run build` (`prisma generate` + `tsc`) |
| Tests | `npm test` · cobertura: `npm run test:coverage` |
| Lint | `npm run lint` · autofix: `npm run lint:fix` |
| Reset BD (borra + migra + seedea) | `npm run db:reset` |

**Frontend** (en `apps/ui/`): dev `npm run dev` · build `npm run build`.

---

## Regla crítica — mantenimiento del contexto

`docs/context.md` describe el **estado vigente**; debe actualizarse en la misma sesión cada vez que se toma una decisión relevante (arquitectura, UX, BD, stack, o un "lo dejamos para después" que define un límite del MVP). El historial fechado va a `docs/decisions.md` (no mezclar changelog dentro de context.md). Si al cerrar la sesión hay decisiones que no quedaron documentadas, el contexto está desactualizado: actualizarlo es parte del trabajo.

## Regla crítica — consistencia de historias de usuario

Cuando una decisión funcional afecta campos, flujos o comportamientos ya definidos en las historias, **las stories se actualizan en la misma sesión**:
1. ¿Afecta campos de una entidad? → actualizar las US que los mencionan.
2. ¿Cambia un flujo o comportamiento? → actualizar los criterios de aceptación afectados.
3. ¿Es una historia nueva? → asignar ID único en el epic correcto y agregarla al README.
4. ¿Cambia el total? → actualizar el conteo en `docs/stories/README.md` y en `docs/context.md`.

---

## Skills

Las skills disponibles las inyecta el harness en cada sesión (no se listan a mano aquí). **Invocar proactivamente** la skill correspondiente —antes de responder, sin esperar a que el usuario lo pida— en estas situaciones:

| Situación | Skill |
|-----------|-------|
| Diseñar/revisar tablas, columnas, índices o relaciones PostgreSQL | `/postgresql-table-design` |
| Escribir/revisar/optimizar queries SQL | `/postgresql-optimization` |
| Code review de funciones, triggers o SQL de PostgreSQL | `/postgresql-code-review` |
| Editar `schema.prisma` (tipos nativos PG: `@db.Uuid`, `@db.VarChar`, …) | `/prisma-postgres` |
| Queries con PrismaClient (`findMany`, `create`, transacciones, `include`/`select`) | `/prisma-client-api` |
| Comandos Prisma CLI (`migrate`, `seed`, `generate`, `studio`) | `/prisma-cli` |
| Crear o modificar componentes React / UI | `/frontend-design` |
| Rendimiento, bundle o patrones React | `/vercel-react-best-practices` |
| Servidor, endpoint o middleware Node/Express | `/nodejs-backend-patterns` |
| Tipos TS complejos (generics, conditional, mapped, utility types) | `/typescript-advanced-types` |
| Arquitectura hexagonal / DDD / puertos y adaptadores | `/clean-ddd-hexagonal` |
| Buscar si existe una skill para una necesidad | `/find-skills` |

Para cambios dirigidos por especificación están disponibles las skills `openspec-*` (`explore`, `propose`, `apply`, `archive`).

---

## Convenciones

Idioma por capa, copy y estilo de nombres están en `docs/context.md` → "Convenciones". Regla de oro: lo que ve el usuario en pantalla → español latino (tuteo, sin voseo); lo que lee el dev en código → inglés.

---

## ⚠️ Regla crítica — Fidelidad visual al preview

Al generar código de UI, el estilo debe coincidir **exactamente** con los previews aprobados en `docs/preview/`. El preview es el contrato visual firmado: no inventar estilos ni usar defaults de librerías sin verificar. Los tokens exactos (colores, tipografía, layout, badges) están en `docs/context.md` → "Design System". Guardrail más violado: el primary es `#0f172a` (slate-900), **no azul**.

---

## ⚠️ Regla crítica — Base de datos

**Fuente de verdad canónica:** `apps/api/prisma/schema.prisma` + `apps/api/prisma/migrations/`. Prisma gestiona el ciclo de vida del schema. Los scripts SQL de `docs/db/` son **espejos** que deben sincronizarse en el mismo cambio (si divergen, manda Prisma).

### Convenciones del schema (no negociables)

- **Idioma:** todos los identificadores (tablas, columnas, constraints, índices) en **inglés**. Los *valores* de datos pueden quedar en español (contenido de negocio).
- **Auditoría tiered:** bloque estándar al final de cada tabla = `created_at`, `created_by` (`VARCHAR(50)` `DEFAULT 'admin'`), `updated_at` (nullable), `updated_by`, `deleted_at`, `deleted_by`, `is_active`. No todas lo llevan completo (tablas puente, tokens y logs llevan menos).
- **PKs:** UUID `gen_random_uuid()` en entidades; las tablas puente usan **PK compuesta** sin `id` surrogate.

### Workflow de migraciones (Prisma)

| Situación | Acción |
|-----------|--------|
| Nueva BD desde cero | `docker compose up` + `prisma migrate deploy` + `prisma db seed` |
| BD existente con datos | `prisma migrate dev --name <descripcion>` |
| Tests locales | `prisma migrate reset` (borra + migra + seedea) |
| Producción | `prisma migrate deploy` (no interactivo, no resetea) |

### Archivos

- **`apps/api/prisma/schema.prisma`** — Fuente de verdad. Editar aquí, luego `prisma migrate dev`.
- **`apps/api/prisma/migrations/`** — Migraciones generadas por Prisma. No editar manualmente.
- **`apps/api/prisma/seed.ts`** — Datos iniciales (catálogos + admin). `prisma db seed` o `prisma migrate reset`.
- **`docs/db/schema.sql`** — Espejo SQL del DDL completo (un único script, sin migraciones incrementales). Sincronizar con `schema.prisma` en el mismo cambio.
- **`docs/db/seeds.sql`** — Espejo SQL de los datos iniciales (`prisma/seed.ts`). Sincronizar cuando cambien los seeds.
- **`docs/db/legacy-migration/legacy-migration.sql`** — Migración de datos v1→v2. Sincronizar si un cambio de schema afecta las tablas/columnas que toca.
- **`docs/db/schema.md`** — Documentación del schema. Mantener al día cuando cambie `schema.prisma`.

### Cómo agregar un cambio de schema

1. Editar `apps/api/prisma/schema.prisma`.
2. Ejecutar `prisma migrate dev --name <descripcion>` (Prisma genera el SQL y aplica).
3. Sincronizar los espejos SQL en el mismo cambio: `docs/db/schema.sql`, `docs/db/seeds.sql` y, si aplica, `docs/db/legacy-migration/legacy-migration.sql`.
4. Actualizar `docs/db/schema.md` con la tabla/columna afectada.

**Nunca** modificar migraciones generadas ni aplicar SQL directo a la BD sin registrarlo en Prisma.

---

## Estado actual

Ver `docs/context.md` para el estado detallado del proyecto.
