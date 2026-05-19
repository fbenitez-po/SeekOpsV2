# Backend — Seekops

Node.js + Express + TypeScript + Prisma + Zod.

---

## Estructura

```
backend/
├── src/
│   ├── modules/             ← un directorio por dominio
│   │   ├── auth/            ← routes, service, repository
│   │   ├── clients/         ← routes, controller, service, repository, mapper, schema
│   │   ├── config/
│   │   ├── users/
│   │   ├── projects/
│   │   ├── timeEntries/
│   │   ├── projections/
│   │   └── finance/
│   │       ├── periods/
│   │       ├── revenues/
│   │       ├── adminExpenses/
│   │       ├── salesCosts/
│   │       └── personnelCosts/
│   ├── shared/
│   │   ├── config/env.ts    ← variables de entorno validadas con Zod
│   │   ├── db/prisma.ts     ← PrismaClient singleton
│   │   ├── http/            ← errorHandler, asyncHandler
│   │   ├── middlewares/     ← auth (verifyToken, adminOnly, managerOrAdmin), validate
│   │   └── services/        ← email.service.ts
│   ├── generated/prisma/    ← cliente Prisma generado (no editar)
│   ├── types/express.d.ts   ← extensión de req.user
│   ├── app.ts               ← Express app (monta routers)
│   └── index.ts             ← entry point (listen)
├── prisma/
│   ├── schema.prisma        ← FUENTE DE VERDAD del schema
│   ├── migrations/          ← historial generado por Prisma
│   └── seed.ts              ← datos iniciales (catálogos + admin)
├── tests/
│   └── contract/            ← tests de contrato supertest (oráculo)
├── api/
│   └── index.js             ← handler Vercel serverless → dist/
├── tsconfig.json
├── prisma.config.ts
└── package.json
```

---

## Variables de entorno

```bash
cp .env.example .env
```

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | Postgres connection string |
| `JWT_SECRET` | Secreto para access tokens |
| `JWT_EXPIRES_IN` | Expiración del access token (ej: `1h`) |
| `JWT_REFRESH_SECRET` | Secreto para refresh tokens |
| `JWT_REFRESH_EXPIRES_IN` | Expiración del refresh token (ej: `7d`) |
| `FRONTEND_URL` | URL del frontend (CORS + email links) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | Email (opcional; si no está, los links van a consola) |
| `EMAIL_FROM` | Remitente de emails |

---

## Comandos

```bash
# Instalar dependencias
npm install

# Desarrollo con hot-reload
npm run dev

# Build para producción
npm run build          # prisma generate && tsc

# Producción
npm start              # node dist/index.js

# Tests de contrato
npm test

# Gestión de DB (Prisma)
npx prisma migrate dev --name <nombre>   # nueva migración
npx prisma migrate reset                 # borra + migra + seedea (tests locales)
npx prisma migrate deploy                # aplica migraciones en producción
npx prisma studio                        # UI de la BD
npx prisma generate                      # regenerar cliente Prisma
```

---

## Convenciones

- **Idioma del código:** inglés (variables, funciones, columnas, rutas)
- **Idioma UI/API (keys JSON):** español vía capa mapper — contrato congelado con el frontend
- **Validación:** Zod en `*.schema.ts`; no usar express-validator
- **Acceso a DB:** Prisma en `*.repository.ts`; `$queryRaw` solo cuando Prisma no puede expresar la query
- **Errors:** `AppError(mensaje, status)` — el errorHandler mapea PG 23505→409, 23503→400
- **Tests:** contrato primero (`tests/contract/`) antes de refactorizar — son el oráculo
