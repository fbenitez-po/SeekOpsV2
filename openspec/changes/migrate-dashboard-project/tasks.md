## 1. Sub-módulo `dashboard/project`

- [ ] 1.1 `project.repository.ts`: `findAll()` con `prisma.projects.findMany` + `include`: `clients: { include: { client_sectors, client_segmentations } }`, `users` (manager), `productivity_layers`, `project_project_category: { include: { project_categories } }`; `orderBy: { created_at: 'desc' }`
- [ ] 1.2 `project.mapper.ts`: `toDashboardProject(row)` que emite las claves `__` de v1; traduce `actual_start_date→real_start_date`, `actual_end_date→real_end_date`; `status`/`tier`/`evaluation_internal`/`evaluation_external`/`image`/`flag_poll`/`comments_date`/`category__iframe_poll` → `null`; `category__name` y `category_extension__name` → `null` (Q2/Q3 diferidas; resolver luego cambiando solo el mapper)
- [ ] 1.3 `project.service.ts`: `list()` → `repo.findAll()` mapeado (array plano)
- [ ] 1.4 `project.controller.ts`: `list` → `res.json(await service.list())`
- [ ] 1.5 `project.routes.ts`: `router.get('/', ctrl.list)` — sin auth

## 2. Registro

- [ ] 2.1 En `dashboard.routes.ts`: montar `router.use('/project', projectRoutes)`

## 3. Tests de contrato

- [ ] 3.1 `GET /api/dashboard/project` sin token → `200`
- [ ] 3.2 Respuesta es array plano (no `{ data, pagination }`)
- [ ] 3.3 Cada elemento tiene las claves `__` exactas de v1
- [ ] 3.4 `real_start_date`/`real_end_date` reflejan `actual_start_date`/`actual_end_date`
- [ ] 3.5 `status`, `tier`, `evaluation_internal`, `evaluation_external`, `image`, `flag_poll`, `comments_date`, `category__iframe_poll`, `category__name`, `category_extension__name` presentes y en `null` (hasta resolver Q2/Q3)

## 4. Documentación

- [ ] 4.1 Registrar el recurso `project` del módulo `dashboard` en `.ai/context.md`
- [ ] 4.2 Resolver/registrar Q1–Q4 del design (especialmente la ambigüedad de categorías y los campos eliminados) al confirmar con el consumidor BI
