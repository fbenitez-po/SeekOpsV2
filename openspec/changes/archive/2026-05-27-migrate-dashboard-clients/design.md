# Design — migrate-dashboard-clients

## Fuente v1

- View: [apps/projects/views/client_view.py → ClientViewSet](../../../../seek-ops/wapp/apps/projects/views/client_view.py) (`permission_classes = []`, `pagination_class = None`)
- Serializer: [apps/projects/serializers/client_serializer.py → ClientModelSerializer](../../../../seek-ops/wapp/apps/projects/serializers/client_serializer.py)

`ClientViewSet.list` llama `paginate_queryset`, pero como `pagination_class = None` devuelve `None` y cae al `Response(serializer.data)` → **array plano**.

## Mapeo de contrato (v1 → v2)

| clave v1 | origen v2 | nota |
|---|---|---|
| `id` | `clients.id` | int → **uuid** (cambio de tipo, ver Q1) |
| `business_reason` | `clients.legal_name` | razón social |
| `business_name` | `clients.trade_name` | razón comercial |
| `business_number` | `clients.ruc` | |
| `fiscal_address` | `clients.address` (o `null`) | ver Q2 |
| `legal_address` | `null` (o `clients.address`) | ver Q2 |
| `segmentation` | `clients.segmentation_id` | v1 devuelve el PK; v2 uuid (ver Q1) |
| `sector` | `clients.sector_id` | idem |

## Decisiones

1. **Claves en inglés** y **array plano**: heredado de la excepción establecida en `migrate-dashboard-seekers` respecto del spec `api-contract`.
2. **Repository propio read-only**: no reusa el `clients.service` interno (que pagina y mapea a español). Lee `prisma.clients.findMany`.
3. **Gaps a `null`**: las direcciones dobles de v1 se cubren con el único `address` de v2 (reparto en Q2).
4. **Identificadores como UUID (Q1 resuelta, 2026-05-27):** `id`, `segmentation` y `sector` se devuelven con el **UUID de v2 tal cual**, sin intentar emular los enteros de v1. Aún no se conoce cómo los usa BI; si más adelante resultara que los consume como clave entera, se reabre. Por ahora se prioriza exponer el identificador real de v2.

## Preguntas abiertas

- **Q2 — Reparto de `fiscal_address`/`legal_address`:** v2 tiene un solo `address`. Default propuesto: `fiscal_address = clients.address`, `legal_address = null`. Confirmar cuál de las dos era la que BI realmente usa, o si conviene `null` en ambas hasta tener el dato.
- **Q3 — `segmentation`/`sector` como id vs nombre:** v1 los expone como PK (no el nombre). Se preserva ese comportamiento (id, ahora UUID por Q1). Si BI esperaba el nombre, se cambia a `client_segmentations.name`/`client_sectors.name`.
