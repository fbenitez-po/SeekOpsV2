## 1. Sub-módulo `dashboard/clients`

- [ ] 1.1 `clients.repository.ts`: `findAll()` con `prisma.clients.findMany({ select: { id, legal_name, trade_name, ruc, address, segmentation_id, sector_id }, orderBy: { created_at: 'desc' } })` (read-only, sin paginación)
- [ ] 1.2 `clients.mapper.ts`: `toDashboardClient(row)` → `{ id, business_reason: legal_name, business_name: trade_name, business_number: ruc, fiscal_address: address, legal_address: null, segmentation: segmentation_id, sector: sector_id }` (reparto de address según Q2 del design)
- [ ] 1.3 `clients.service.ts`: `list()` → `repo.findAll()` mapeado (array plano)
- [ ] 1.4 `clients.controller.ts`: `list` → `res.json(await service.list())`
- [ ] 1.5 `clients.routes.ts`: `router.get('/', ctrl.list)` — sin auth

## 2. Registro

- [ ] 2.1 En `dashboard.routes.ts`: montar `router.use('/clients', clientsRoutes)`

## 3. Tests de contrato

- [ ] 3.1 `GET /api/dashboard/clients` sin token → `200`
- [ ] 3.2 Respuesta es array plano (no `{ data, pagination }`)
- [ ] 3.3 Cada elemento tiene exactamente: `id, business_reason, business_name, business_number, fiscal_address, legal_address, segmentation, sector`
- [ ] 3.4 `business_reason`/`business_name`/`business_number` reflejan `legal_name`/`trade_name`/`ruc`

## 4. Documentación

- [ ] 4.1 Registrar el recurso `clients` del módulo `dashboard` en `.ai/context.md`
- [ ] 4.2 Resolver/registrar las preguntas abiertas Q1–Q3 del design cuando se confirme con el consumidor BI
