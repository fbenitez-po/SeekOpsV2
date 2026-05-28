# api-documentation Specification

## Purpose
Documentación de la API del backend (`apps/api`) generada desde el código: documento OpenAPI 3.1 derivado de schemas Zod y metadata de rutas (sin spec mantenido a mano), UI interactiva navegable en `/docs` que funciona en serverless (Vercel), response schemas Zod como fuente de verdad atada al compilador (`tsc`), helper de ruta única que monta y documenta a la vez, esquema de seguridad JWT `bearerAuth`, y adopción incremental sin romper el contrato existente. Refleja el estado del código tras el change `add-openapi-docs`.

## Requirements

### Requirement: Documento OpenAPI generado desde el código
El sistema SHALL exponer un documento OpenAPI 3.1 generado a partir de los schemas Zod y la metadata de las rutas, sin ningún archivo de especificación mantenido a mano. El documento MUST incluir, por cada ruta documentada, su método, path, parámetros, request body (cuando aplique), respuestas por código de estado, y el esquema de seguridad cuando la ruta requiere autenticación.

#### Scenario: El documento se sirve como JSON
- **WHEN** un cliente hace `GET /docs/openapi.json`
- **THEN** el sistema responde un documento OpenAPI 3.1 válido en JSON que incluye las rutas de los módulos migrados

#### Scenario: Los servers reflejan el prefijo configurado
- **WHEN** se genera el documento OpenAPI con `API_PREFIX` configurado (default `/api/v1`)
- **THEN** el campo `servers` del documento apunta a ese prefijo, de modo que el "Try it out" llama al path correcto

#### Scenario: No existe especificación mantenida a mano
- **WHEN** se agrega o modifica una ruta documentada en el código
- **THEN** el documento OpenAPI refleja el cambio sin editar ningún archivo `.yaml`/`.json` de spec a mano

### Requirement: UI de documentación navegable
El sistema SHALL servir una interfaz interactiva de documentación de la API en la ruta `GET /docs`, usable por el equipo de desarrollo, el frontend y terceros. La UI MUST renderizarse correctamente en el entorno de deploy serverless (Vercel) sin depender de assets estáticos que fallen en ese entorno.

#### Scenario: La UI carga y lista los endpoints documentados
- **WHEN** un usuario abre `GET /docs` en el navegador
- **THEN** se muestra la documentación interactiva con los endpoints de los módulos migrados, sus parámetros y sus respuestas

#### Scenario: La UI funciona en serverless
- **WHEN** la API se despliega en Vercel serverless y se abre `/docs`
- **THEN** la UI carga completa sin errores de assets faltantes

### Requirement: Schema Zod de response como fuente de verdad atada al compilador
El sistema SHALL definir la forma de cada respuesta documentada mediante un schema Zod, y los `mapper` correspondientes MUST tipar su valor de retorno con `z.infer<typeof ResponseSchema>`. La compilación (`tsc`) MUST fallar cuando la salida del mapper diverge del schema documentado.

#### Scenario: El mapper diverge del schema documentado
- **WHEN** un `mapper` omite o renombra un campo respecto a su response schema Zod
- **THEN** `tsc` falla en el build, impidiendo que la documentación quede desincronizada del código

#### Scenario: La respuesta documentada coincide con el schema
- **WHEN** se documenta la respuesta de un endpoint
- **THEN** el schema usado para la doc es el mismo que tipa el retorno del mapper de ese endpoint

### Requirement: Helper de ruta única que monta y documenta
El sistema SHALL proveer un helper de ruta que, en una sola declaración, monte el endpoint en Express y registre su metadata OpenAPI. El `routes.ts` de cada módulo MUST seguir siendo la única declaración de la ruta (sin un registry paralelo que la re-declare).

#### Scenario: Declarar una ruta documentada
- **WHEN** un módulo declara una ruta usando el helper con su request schema, response schema, códigos de error y requerimiento de auth
- **THEN** el endpoint queda montado en Express y, a la vez, presente en el documento OpenAPI, sin declararlo dos veces

#### Scenario: Auth declarada en un solo lugar
- **WHEN** una ruta se declara como autenticada en el helper
- **THEN** el helper aplica el middleware de autenticación JWT y referencia el security scheme `bearerAuth` en la doc, sin declarar la auth por separado

### Requirement: Esquema de seguridad JWT en la documentación
El sistema SHALL registrar una vez, a nivel global del documento, un esquema de seguridad `bearerAuth` de tipo HTTP bearer (JWT). Las rutas autenticadas MUST referenciar ese esquema en su definición OpenAPI.

#### Scenario: Ruta autenticada en la doc
- **WHEN** se documenta una ruta que requiere JWT
- **THEN** el endpoint en el documento OpenAPI declara el requerimiento de seguridad `bearerAuth`

#### Scenario: La UI permite autorizar con un token
- **WHEN** un usuario usa la UI de `/docs` para fijar un token bearer
- **THEN** las llamadas "Try it out" a rutas autenticadas incluyen la cabecera `Authorization: Bearer <token>`

### Requirement: Adopción incremental sin romper el contrato existente
El sistema SHALL permitir documentar los módulos de forma incremental. Los módulos aún no migrados MUST seguir funcionando sin cambios y simplemente no aparecer en el documento. La adopción de la documentación MUST NOT alterar los paths, las claves JSON ni el comportamiento de runtime de los endpoints existentes.

#### Scenario: Módulo no migrado sigue operativo
- **WHEN** un módulo todavía no usa el helper de documentación
- **THEN** sus endpoints responden igual que antes y no aparecen en el documento OpenAPI

#### Scenario: Migrar un módulo no cambia su contrato
- **WHEN** un módulo se migra al helper y a los response schemas
- **THEN** las respuestas de sus endpoints conservan las mismas claves JSON y el mismo comportamiento que antes de la migración
