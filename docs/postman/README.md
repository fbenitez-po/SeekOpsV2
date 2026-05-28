# Postman — SeekOps v2 Backend

Colección de Postman del backend de SeekOps v2 (TypeScript + Express + Prisma).

## Archivos

- **`SeekOpsV2.postman_collection.json`** — Colección con todos los endpoints (77 requests, 15 grupos).

## Cómo usar

1. **Importar** `SeekOpsV2.postman_collection.json` en Postman.
2. Ajustar la variable de colección **`base_root`** si el backend no corre en `http://localhost:3000`. La variable `base_url` se arma sola como `{{base_root}}/api/v1`.
3. Ejecutar **Auth → Login** con un usuario válido. El script de test guarda `access_token` y `refresh_token` en las variables de la colección automáticamente; el resto de los requests heredan el Bearer token.
4. Completar las variables `*_id` (placeholders) con IDs reales. Muchos salen de los endpoints del grupo **Config** (`equipos`, `areas`, `segmentaciones`, etc.).

## Notas de contrato

- Base path real: **`/api/v1`** (configurable por `API_PREFIX`). `/health` cuelga de la raíz.
- Claves de request/response en **español**, salvo el grupo **Dashboard**, que replica el contrato en **inglés** heredado de v1 (integración externa / BI).
- Autorización por defecto: la mayoría requiere rol **ADMIN**; **Projections** requiere GESTOR o ADMIN; **Dashboard** y **Auth (login/refresh/reset)** son abiertos (sin token).

## Mantenimiento

Esta colección debe mantenerse **sincronizada con la API** a medida que evoluciona. Actualizarla cuando:

- Se agrega/quita/renombra un endpoint o cambia su método o path.
- Cambia el body o los query params de un request (revisar el `*.schema.ts` del módulo).
- Se monta un módulo nuevo en `apps/api/src/app.ts`.

Pendientes conocidos (se agregarán cuando se implementen): recursos del módulo **Dashboard** → `clients`, `commercial`, `project` (changes OpenSpec `migrate-dashboard-*`).
