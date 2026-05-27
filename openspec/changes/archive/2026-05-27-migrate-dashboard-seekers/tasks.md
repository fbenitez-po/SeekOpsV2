## 1. Estructura del módulo `dashboard`

- [x] 1.1 Crear `backend/src/modules/dashboard/dashboard.routes.ts` que monte el sub-router de seekers en `/seekers`
- [x] 1.2 Crear la carpeta `backend/src/modules/dashboard/seekers/`

## 2. Sub-módulo `seekers` — acceso a datos y mapeo

- [x] 2.1 `seekers.repository.ts`: `findAll()` con `prisma.users.findMany({ include: { teams: { select: { name: true } } }, orderBy: [{ last_name: 'asc' }, { first_name: 'asc' }] })` (solo lectura, sin paginación, todos los usuarios)
- [x] 2.2 `seekers.mapper.ts`: `toSeeker(row)` → `{ email, first_name, last_name, job: position, cellphone: mobile_phone, document_number, team: teams?.name ?? null, is_active }`

## 3. Sub-módulo `seekers` — service, controller, routes

- [x] 3.1 `seekers.service.ts`: `list()` → `repo.findAll()` mapeado con `mapper.toSeeker` (devuelve array plano, sin envoltorio de paginación)
- [x] 3.2 `seekers.controller.ts`: `list` → `res.json(await service.list())`
- [x] 3.3 `seekers.routes.ts`: `router.get('/', ctrl.list)` — **sin** `verifyToken`/`adminOnly`

## 4. Registro en la app

- [x] 4.1 En `backend/src/app.ts`: importar `dashboardRoutes` y agregar `api.use('/dashboard', dashboardRoutes)` (sin auth a nivel de módulo)

## 5. Tests de contrato

- [x] 5.1 Test supertest: `GET /api/dashboard/seekers` **sin token** responde `200` (no `401`)
- [x] 5.2 Test: la respuesta es un array plano (no `{ data, pagination }`)
- [x] 5.3 Test: cada elemento tiene exactamente las claves `email, first_name, last_name, job, cellphone, document_number, team, is_active`
- [x] 5.4 Test: `team` es string cuando hay equipo y `null` cuando no; `job`/`cellphone` reflejan `position`/`mobile_phone`

## 6. Documentación

- [x] 6.1 Registrar en `.ai/context.md` la creación del módulo `dashboard` y la excepción de claves en inglés respecto del spec `api-contract`
- [x] 6.2 Dejar nota del hook de auth pendiente (token compartido) para evaluación futura
