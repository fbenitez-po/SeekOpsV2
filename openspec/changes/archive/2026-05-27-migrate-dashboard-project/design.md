# Design — migrate-dashboard-project

## Fuente v1

- View: [apps/projects/views/project_view.py → ProjectAPIViewSet](../../../../seek-ops/wapp/apps/projects/views/project_view.py) (`permission_classes = []`, `pagination_class = None`)
- Modelo: [apps/projects/models.py → Project](../../../../seek-ops/wapp/apps/projects/models.py)

`list` devuelve `Response(queryset.values(...))` → array de dicts con **claves `__`**.

## Mapeo de contrato (v1 → v2)

| clave v1 (literal) | origen v2 | nota |
|---|---|---|
| `code` | `projects.code` | |
| `name` | `projects.name` | |
| `created_at` | `projects.created_at` | |
| `layer_productivity__name` | `productivity_layers.name` | |
| `client__business_name` | `clients.trade_name` | |
| `client__business_reason` | `clients.legal_name` | |
| `client__business_number` | `clients.ruc` | |
| `client__sector__name` | `client_sectors.name` | |
| `client__segmentation__name` | `client_segmentations.name` | |
| `start_date` | `projects.start_date` | |
| `end_date` | `projects.end_date` | |
| `real_start_date` | `projects.actual_start_date` | renombrado |
| `real_end_date` | `projects.actual_end_date` | renombrado |
| `manager__first_name` | `users.first_name` | |
| `manager__last_name` | `users.last_name` | |
| `manager__document_number` | `users.document_number` | |
| `status` | — | ❌ `null` (open/progress/close) — ver Q1 |
| `tier` | — | ❌ `null` (easy/medium/hard) |
| `evaluation_internal` | — | ❌ `null` |
| `evaluation_external` | — | ❌ `null` |
| `image` | — | ❌ `null` |
| `flag_poll` | — | ❌ `null` |
| `comments_date` | — | ❌ `null` |
| `category__iframe_poll` | — | ❌ `null` |
| `category__name` | `project_categories.name` o `project_segmentation.name`? | 🔄 ambiguo + M2M — ver Q2 |
| `category_extension__name` | `project_categories` (income, M2M) | 🔄 ambiguo — ver Q3 |

## Decisiones

1. **Claves `__` literales** y **array plano**: decisión transversal (compat byte-a-byte).
2. **Repository propio read-only** con `include` anidado; no reusa `projects.service`.
3. **Gaps a `null`**: `status`, `tier`, `evaluation_internal/external`, `image`, `flag_poll`, `comments_date`, `category__iframe_poll`.

## Preguntas abiertas

- **Q1 — `status` (open/progress/close):** v2 no tiene un estado de proyecto; solo `is_active` (bool). Default `null`. Opción de **derivar** (D): `is_active=false → "close"`, fechas reales presentes → "progress", etc. Confirmar si BI filtra por `status`.
- **Q2 — `category__name` (FK → ¿M2M o segmentation?) — DIFERIDA (2026-05-27):** en v1 `Project.category` es un FK a `ProjectCategory` cuyo `verbose_name` es "Segmentación". En v2 hay **dos candidatos**: `project_segmentation` (FK simple) y `project_categories` (M2M vía `project_project_category`). El mapeo correcto **aún no está confirmado con dominio** y se resuelve más adelante. Hasta entonces, `category__name` se expone como `null` (no se elige candidato a ciegas).
- **Q3 — `category_extension__name` (M2M income) — DIFERIDA (2026-05-27):** v1 `category_extension` (ExtensionCategory = "Categoría de ingreso", M2M). En v2 las income categories se consolidaron en `project_categories` (commit "consolidar income_categories en project_categories"). Criterio de selección **sin confirmar**; se resuelve junto con Q2. Hasta entonces, `category_extension__name` se expone como `null`.

> **Nota:** mientras Q2/Q3 estén diferidas, este change puede implementarse igual — ambas claves salen en `null`, manteniendo la forma del contrato. Resolverlas después es solo cambiar el `mapper`, sin tocar el resto del módulo.
- **Q4 — Campos eliminados deliberadamente:** `tier`, `evaluation_internal/external`, `image`, `flag_poll`, `comments_date`, `category.iframe_poll` parecen descartados en el rediseño de v2. Default `null`. Promover a columna nueva (migración) **solo** los que BI consuma de verdad.
