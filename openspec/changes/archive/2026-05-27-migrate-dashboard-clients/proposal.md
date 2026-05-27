## Why

Segundo recurso de la "API Dashboard" de v1 a migrar (después de `seekers`). En v1, `GET /api/client/` ([apps/projects/views/client_view.py → ClientViewSet](../../../../seek-ops/wapp/apps/projects/views/client_view.py)) es un endpoint **abierto, read-only, sin paginación efectiva** (`pagination_class = None`) que serializa los clientes con `ClientModelSerializer` y devuelve un **array plano**.

Reutiliza el módulo paraguas `dashboard` creado en `migrate-dashboard-seekers`, agregando el sub-recurso `clients`. El contrato se preserva idéntico a v1 (claves en inglés), salvo gaps de schema que v2 no tiene equivalente, que se exponen como `null`.

## What Changes

- **NUEVO** sub-módulo `backend/src/modules/dashboard/clients/` (`routes`, `controller`, `service`, `repository`, `mapper`).
- **NUEVO** endpoint `GET /api/dashboard/clients`: abierto, sin paginación, array plano de todos los clientes.
- El `mapper` traduce `clients` de v2 al contrato v1: `legal_name→business_reason`, `trade_name→business_name`, `ruc→business_number`.
- **Gaps a `null`** (decisión del change): v2 colapsó las dos direcciones (`fiscal_address`/`legal_address`) en un solo `address`; ver `design.md` para el reparto.
- Registro del sub-router en `dashboard.routes.ts` (`/clients`).

## Capabilities

### New Capabilities
<!-- ninguna -->

### Modified Capabilities
- `dashboard-api`: se agrega el recurso `clients` (listado público read-only con contrato heredado de v1).

## Impact

- **Backend (`backend/src/modules/dashboard/clients/`):** archivos nuevos. No toca el módulo `clients` existente (CRUD interno en español).
- **Backend (`dashboard.routes.ts`):** una línea montando `/clients`.
- **Schema/DB:** sin cambios (solo lectura de `clients` + `client_segmentations` + `client_sectors`).
- **Contrato:** claves en inglés (excepción documentada al spec `api-contract`, ya establecida en `migrate-dashboard-seekers`).
- **Dependencia:** requiere el módulo `dashboard` de `migrate-dashboard-seekers`.
- **Tests:** contrato supertest (array plano, claves v1, 200 sin token).
