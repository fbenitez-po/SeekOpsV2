## Why

Tercer recurso de la "API Dashboard" de v1. `GET /api/commercial/` ([apps/commercial/views.py → CommercialViewSet](../../../../seek-ops/wapp/apps/commercial/views.py)) es un endpoint **abierto, read-only, sin paginación** (`pagination_class = None`) que devuelve un **array plano desnormalizado** vía `.values(...)` (claves con `__` de Django) cruzando `Commercial → project → client → sector/segmentation/category` y `responsible`.

Agrega el sub-recurso `commercial` al módulo `dashboard`. Contrato idéntico a v1 (claves `__` literales); los campos sin equivalente en v2 se exponen como `null`.

## What Changes

- **NUEVO** sub-módulo `backend/src/modules/dashboard/commercial/` (`routes`, `controller`, `service`, `repository`, `mapper`).
- **NUEVO** endpoint `GET /api/dashboard/commercial`: abierto, sin paginación, array plano desnormalizado, ordenado por `-created_at`.
- El `repository` lee `commercial_records` con `include` anidado de `projects → clients → {client_sectors, client_segmentations, project_categories}`, `users` (owner) y `document_types`.
- El `mapper` reproduce las claves `__` de v1 y traduce: `record_date→date`, `currency→coin`, `has_contract→status`, `is_billed→billing`, `owner→responsible`, `document_type.name→document`.
- **Gaps a `null`**: `type`, `division__name`, `duration` (sin equivalente en v2). Ver `design.md`.

## Capabilities

### New Capabilities
<!-- ninguna -->

### Modified Capabilities
- `dashboard-api`: se agrega el recurso `commercial` (listado público read-only desnormalizado, contrato heredado de v1).

## Impact

- **Backend (`backend/src/modules/dashboard/commercial/`):** archivos nuevos. No toca el módulo `commercial` existente.
- **Backend (`dashboard.routes.ts`):** una línea montando `/commercial`.
- **Schema/DB:** sin cambios (solo lectura). 3 campos del contrato quedan en `null` por falta de equivalente.
- **Dependencia:** requiere el módulo `dashboard` de `migrate-dashboard-seekers`; comparte el mapeo cliente/categoría con `migrate-dashboard-clients` y `migrate-dashboard-project`.
- **Tests:** contrato supertest (array plano, claves `__` de v1, 200 sin token, gaps en `null`).
