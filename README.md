# Seekops

Plataforma web para registro de horas trabajadas de empleados (seekers) en proyectos de clientes, con flujo de aprobación, gestión de usuarios/clientes/proyectos y módulos de finanzas y comercial. Reemplaza una versión obsoleta (v1) con mejor UX y un stack moderno.

## Stack

- **Frontend:** React + Vite + shadcn/ui + Tailwind CSS
- **Backend:** Node.js + Express + TypeScript strict + Prisma 7 + Zod
- **Base de datos:** PostgreSQL
- **Autenticación:** JWT (access + refresh tokens)

## Estructura del repo

```
SeekOpsV2/
├── backend/          # API Node + Express + TS + Prisma (src/modules/, src/shared/, prisma/)
├── frontend/         # App React + Vite + shadcn/ui + Tailwind
├── database/         # Espejos SQL: schema.sql, seeds.sql, schema.md, legacy-migration/
├── docs/             # Documentación del proyecto
│   ├── context.md    # Fuente de verdad (leer primero cada sesión)
│   ├── decisions.md  # Historial cronológico de decisiones
│   ├── brief.md      # Brief del producto
│   ├── stories/      # Historias de usuario por epic
│   ├── ux/           # Design system, flows y screens
│   ├── preview/      # Previews HTML (contrato visual)
│   └── api/          # Contratos REST + mocks JSON
├── openspec/         # Cambios dirigidos por especificación
├── postman/          # Colección Postman de la API
├── docker-compose.yml
└── CLAUDE.md         # Instrucciones para agentes
```

## Cómo correr

### Todo en local (recomendado)

```bash
docker compose up
```

Levanta PostgreSQL + backend + frontend. El backend aplica migraciones y seedea automáticamente al arrancar.

### Backend (en `backend/`)

| Acción | Comando |
|--------|---------|
| Dev (watch) | `npm run dev` |
| Build | `npm run build` (`prisma generate` + `tsc`) |
| Tests | `npm test` · cobertura: `npm run test:coverage` |
| Lint | `npm run lint` · autofix: `npm run lint:fix` |
| Reset BD (borra + migra + seedea) | `npm run db:reset` |

### Frontend (en `frontend/`)

```bash
npm run dev      # servidor de desarrollo
npm run build    # build de producción
```

## Base de datos

La fuente de verdad del schema es `backend/prisma/schema.prisma` + `backend/prisma/migrations/`. Los scripts SQL de `database/` son espejos que deben mantenerse sincronizados. Ver `CLAUDE.md` → "Regla crítica — Base de datos" para el workflow de cambios.

## Roles

- **Seeker** — registra horas en proyectos asignados.
- **Gestor** — aprueba/observa/rechaza horas del equipo de sus proyectos.
- **Administrador** — gestiona usuarios, clientes, proyectos, finanzas y comercial.

## Documentación

Empezar por [`docs/context.md`](docs/context.md) (estado vigente del proyecto) y [`docs/decisions.md`](docs/decisions.md) (historial de decisiones).
