## Why

Hoy la API no tiene documentación navegable: el contrato vive en `docs/api/contracts-rol.md` (mantenido a mano, propenso a divergir) y en la cabeza de quien escribió cada módulo. El equipo de frontend, los devs del backend y cualquier tercero que quiera entender o consumir el servicio no tienen una referencia interactiva confiable. Como ya usamos Zod en todos los módulos para validar inputs, podemos generar documentación OpenAPI desde el código y atarla al compilador, de modo que **nunca pueda mentir**.

## What Changes

- Se agrega un documento OpenAPI 3.1 **generado desde el código** (no mantenido a mano) y una UI navegable servida en `/docs`.
- Se introducen **schemas Zod de response** por módulo como fuente de verdad de la forma de cada salida. Los `mapper.ts` pasan a tipar su retorno con `z.infer<typeof ResponseSchema>`, de modo que el compilador (`tsc`) falla si el mapper diverge del contrato documentado.
- Se introduce un **helper de ruta** que monta el endpoint en Express **y** registra su metadata OpenAPI (path, params, body, responses, códigos de error, auth) en una sola llamada, preservando el estilo declarativo de `routes.ts` sin duplicar la definición de rutas.
- Se registra el esquema de seguridad **JWT (bearer)** una vez a nivel global, reutilizado por las rutas autenticadas.
- Adopción **incremental**: el primer módulo documentado es `dashboard` (la superficie de integración con terceros: 4 sub-recursos read-only y abiertos), porque es exactamente lo que se quiere exponer primero. `auth` y los módulos CRUD se documentan en cambios posteriores reutilizando el mismo patrón.
- La UI elegida es **Scalar**: moderna, con "Try it out" gratuito (los terceros ven *y prueban* la API) y empaquetada en un solo bundle que funciona en cualquier deploy (serverless o servidor tradicional), sin depender de que producción sea Vercel.
- La doc autogenerada **reemplaza** a `docs/api/contracts-rol.md` como fuente de verdad del contrato a medida que cada módulo se migra (el archivo a mano queda obsoleto por módulo migrado).

## Capabilities

### New Capabilities
- `api-documentation`: documentación OpenAPI autogenerada desde schemas Zod, contrato request+response atado al compilador, esquema de seguridad JWT, y UI interactiva navegable servida por la API.

### Modified Capabilities
<!-- Ninguna capability con requisitos versionados en openspec/specs/ cambia su comportamiento. -->

## Impact

- **Dependencias nuevas** (`apps/api`): `zod-openapi` (generación del documento desde Zod) y `@scalar/express-api-reference` (UI). No se usa `swagger-ui-express` (assets estáticos, fricción en serverless) ni Redoc open-source (sin "Try it out").
- **Código afectado** (`apps/api/src`):
  - `shared/openapi/` (nuevo): registry, ensamblado del documento, registro de seguridad JWT, montaje de la UI.
  - `shared/http/` o `shared/middlewares/`: nuevo helper de ruta documentada (wrapper sobre el `Router` de Express).
  - Por módulo migrado: `*.schema.ts` (agrega response schemas), `*.mapper.ts` (tipa retorno con `z.infer`), `*.routes.ts` (usa el helper).
  - `app.ts`: monta la UI en `/docs` y el JSON del documento (p. ej. `/docs/openapi.json`).
- **Compatibilidad:** sin cambios en el contrato JSON existente ni en los paths de negocio; es aditivo. El `API_PREFIX` configurable debe reflejarse en los servers del documento OpenAPI.
- **Docs del repo:** `docs/context.md` (decisión de arquitectura nueva) y eventual deprecación de `docs/api/contracts-rol.md`.
