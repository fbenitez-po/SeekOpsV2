## Why

Cuarto y último recurso de la "API Dashboard" de v1. `GET /api/project/` ([apps/projects/views/project_view.py → ProjectAPIViewSet](../../../../seek-ops/wapp/apps/projects/views/project_view.py)) es un endpoint **abierto, read-only, sin paginación** (`pagination_class = None`) que devuelve un **array plano desnormalizado** vía `.values(...)` cruzando `Project → client → sector/segmentation`, `manager`, `layer_productivity` y `category`/`category_extension`, ordenado por `-created_at`.

Es el contrato con **más gaps**: v2 rediseñó `projects` y eliminó varios campos de v1 (`status`, `tier`, `evaluation_internal/external`, `image`, `flag_poll`, `comments_date`, `category.iframe_poll`). Según la decisión transversal, esos campos se exponen como `null`.

## What Changes

- **NUEVO** sub-módulo `backend/src/modules/dashboard/project/` (`routes`, `controller`, `service`, `repository`, `mapper`).
- **NUEVO** endpoint `GET /api/dashboard/project`: abierto, sin paginación, array plano desnormalizado, ordenado por `-created_at`.
- El `repository` lee `projects` con `include`: `clients → {client_sectors, client_segmentations}`, `users` (manager), `productivity_layers`, `project_project_category → project_categories`.
- El `mapper` reproduce las claves `__` de v1 y traduce `actual_start_date→real_start_date`, `actual_end_date→real_end_date`.
- **Gaps a `null`**: `status`, `tier`, `evaluation_internal`, `evaluation_external`, `image`, `flag_poll`, `comments_date`, `category__iframe_poll`. Ver `design.md`.
- **Ambigüedad de categorías** (`category__name`, `category_extension__name`): resuelta como pregunta abierta en `design.md`.

## Capabilities

### New Capabilities
<!-- ninguna -->

### Modified Capabilities
- `dashboard-api`: se agrega el recurso `project` (listado público read-only desnormalizado, contrato heredado de v1, con la mayor cantidad de gaps a `null`).

## Impact

- **Backend (`backend/src/modules/dashboard/project/`):** archivos nuevos. No toca el módulo `projects` existente.
- **Backend (`dashboard.routes.ts`):** una línea montando `/project`.
- **Schema/DB:** sin cambios. **8 campos** del contrato quedan en `null` por falta de equivalente; 2 más (categorías) dependen de resolver la ambigüedad v1↔v2.
- **Dependencia:** requiere el módulo `dashboard` de `migrate-dashboard-seekers`; comparte el mapeo cliente con `migrate-dashboard-clients`/`-commercial`.
- **Riesgo:** si BI consume `status`/`tier`/`evaluaciones`, el `null` por defecto degrada el dashboard. Decisión de negocio a confirmar antes de implementar.
- **Tests:** contrato supertest (array plano, claves `__` de v1, 200 sin token, gaps en `null`).
