## 1. Sub-módulo `dashboard/commercial`

- [x] 1.1 `commercial.repository.ts`: `findAll()` con `prisma.commercial_records.findMany` + `include` anidado: `projects: { include: { clients: { include: { client_sectors, client_segmentations } }, users (manager), project_project_category: { include: { project_categories } } } }`, `users` (owner), `document_types`; `orderBy: { created_at: 'desc' }`
- [x] 1.2 `commercial.mapper.ts`: `toDashboardCommercial(row)` que emite las claves `__` de v1 y traduce `record_date→date`, `currency→coin`, `has_contract→status`, `is_billed→billing`, `owner→responsible__*`, `document_types.name→document`; `type`/`division__name`/`duration` → `null`; `project__category__name` = primera categoría activa o `null` (Q2)
- [x] 1.3 `commercial.service.ts`: `list()` → `repo.findAll()` mapeado (array plano)
- [x] 1.4 `commercial.controller.ts`: `list` → `res.json(await service.list())`
- [x] 1.5 `commercial.routes.ts`: `router.get('/', ctrl.list)` — sin auth

## 2. Registro

- [x] 2.1 En `dashboard.routes.ts`: montar `router.use('/commercial', commercialRoutes)`

## 3. Tests de contrato

- [x] 3.1 `GET /api/dashboard/commercial` sin token → `200`
- [x] 3.2 Respuesta es array plano (no `{ data, pagination }`)
- [x] 3.3 Cada elemento tiene las claves `__` exactas de v1
- [x] 3.4 `date`/`coin`/`status`/`billing` reflejan `record_date`/`currency`/`has_contract`/`is_billed`
- [x] 3.5 `type`, `division__name`, `duration` presentes y en `null`

## 4. Documentación

- [x] 4.1 Registrar el recurso `commercial` del módulo `dashboard` en `.ai/context.md`
- [x] 4.2 Resolver/registrar Q1–Q3 del design al confirmar con el consumidor BI
