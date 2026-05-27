# Design — migrate-dashboard-commercial

## Fuente v1

- View: [apps/commercial/views.py → CommercialViewSet](../../../../seek-ops/wapp/apps/commercial/views.py) (`permission_classes = []`, `pagination_class = None`)
- Modelo: [apps/commercial/models.py → Commercial](../../../../seek-ops/wapp/apps/commercial/models.py)

`list` devuelve `Response(queryset.values(...))` → array de dicts cuyas **claves son los paths con `__`** (`project__client__business_name`, etc.), ordenado por `-created_at`.

## Mapeo de contrato (v1 → v2)

| clave v1 (literal) | origen v2 | nota |
|---|---|---|
| `date` | `commercial_records.record_date` | |
| `detail` | `detail` | |
| `price` | `price` | |
| `coin` | `currency` | renombrado |
| `type` | — | ❌ `null` (Recurrente/Proyecto/Renovación) |
| `document` | `document_types.name` (vía `document_type_id`) | era choice → FK |
| `status` | `has_contract` | renombrado (bool "estado de contrato") |
| `billing` | `is_billed` | renombrado |
| `division__name` | — | ❌ `null` (v2 no tiene tabla `divisions`) |
| `project__name` | `projects.name` | |
| `project__code` | `projects.code` | |
| `project__client__business_name` | `clients.trade_name` | |
| `project__client__business_number` | `clients.ruc` | |
| `project__client__business_reason` | `clients.legal_name` | |
| `project__client__sector__name` | `client_sectors.name` | |
| `project__client__segmentation__name` | `client_segmentations.name` | |
| `project__category__name` | `project_categories.name` (M2M) | ver Q2 |
| `project__manager__first_name` | `projects.users(manager).first_name` | |
| `responsible__first_name` | `commercial_records.users(owner).first_name` | owner→responsible |
| `responsible__last_name` | `users.last_name` | |
| `responsible__document_number` | `users.document_number` | |
| `duration` | — | ❌ `null` (semanas) |

## Decisiones

1. **Claves `__` literales** y **array plano**: decisión transversal (compat byte-a-byte con BI).
2. **Repository propio read-only** con `include` anidado; no reusa `commercial.service` interno.
3. **Gaps a `null`**: `type`, `division__name`, `duration`.

## Preguntas abiertas

- **Q1 — `type`, `division__name`, `duration`:** sin equivalente en v2. Default `null`. Promover a columna nueva solo si BI consume alguno. (`division` implicaría reintroducir una tabla `divisions` que v2 no tiene.)
- **Q2 — `project__category__name` (FK → M2M):** en v1 el proyecto tiene **una** categoría; en v2 es M2M (`project_project_category`). Default propuesto: tomar la primera categoría activa (o `null` si no hay). Confirmar si BI espera un único nombre o conviene concatenar.
- **Q3 — `document` (choice → FK):** en v1 `document` era un texto de choice (`Contrato`/`Orden de Compra`/`Correo`); en v2 es `document_types.name`. Verificar que los nombres del catálogo v2 coincidan con los valores que BI espera.
