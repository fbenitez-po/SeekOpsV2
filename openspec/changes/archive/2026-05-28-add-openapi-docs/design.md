## Context

El backend (`apps/api`) es Express 4 + TypeScript strict + Prisma + **Zod 4** con un patrón modular uniforme: `routes.ts → controller.ts → service.ts → repository.ts → schema.ts (Zod) → mapper.ts`. Zod ya valida los **inputs** de cada ruta vía el middleware `validateBody`. Las **respuestas** las arma `mapper.ts` devolviendo object literals (DB → DTO en español), con tipo de retorno **inferido** por TypeScript — no hay schema declarado ni artefacto en runtime para esas salidas.

El contrato actual vive a mano en `docs/api/contracts-rol.md` y diverge fácilmente. El entorno de producción **aún no está confirmado** (puede ser serverless tipo Vercel o un servidor tradicional); local es docker-compose. Las rutas de negocio cuelgan de `env.API_PREFIX` (default `/api/v1`); `/health` queda en la raíz. Auth es JWT bearer vía middlewares `verifyToken`/`adminOnly`. El contrato JSON se expone en español (excepto el módulo `dashboard`, en inglés).

El primer módulo a documentar es `dashboard`: la superficie de integración con terceros, con 4 sub-recursos (`seekers`, `clients`, `commercial`, `project`), **read-only, abiertos (sin auth) y con claves en inglés** (compatibilidad con la "API Dashboard" de v1).

## Goals / Non-Goals

**Goals:**
- Documentación OpenAPI 3.1 **generada desde el código**, nunca mantenida a mano.
- **Una sola fuente de verdad por respuesta**: un schema Zod que (a) alimenta la doc y (b) tipa el `mapper` vía `z.infer`, de modo que `tsc` falla si divergen.
- UI navegable en `/docs`, usable por dev/frontend/terceros, compatible con serverless.
- Patrón **DRY**: declarar ruta + metadata OpenAPI en una sola llamada, preservando `routes.ts` declarativo.
- Adopción **incremental** sin romper el contrato existente.

**Non-Goals:**
- Documentar los 14 módulos en este cambio (solo el patrón + piloto).
- Cambiar el contrato JSON, los paths, o el comportamiento de runtime de la API.
- Validar las **responses** en runtime con Zod (solo a nivel de tipo con `z.infer`; ver Decisión 3).
- Generar SDKs/clientes tipados a partir del spec (posible trabajo futuro, fuera de alcance).
- Documentar `auth` y los módulos CRUD en este cambio (el piloto es `dashboard`; el resto va después).

## Decisions

### Decisión 1 — Fuente de verdad de las responses: schema Zod + `z.infer` en el mapper
El schema Zod de respuesta es la fuente de verdad. El mapper declara su retorno como `z.infer<typeof ResponseSchema>`:

```typescript
// clients.schema.ts
export const ClientDetailResponse = z.object({ id: z.string().uuid(), razon_social: z.string(), /* ... */ });
// clients.mapper.ts
export function toClientDetail(...): z.infer<typeof ClientDetailResponse> { /* ... */ }
```

Si el mapper omite/renombra un campo respecto al schema, `tsc` falla → la doc no puede mentir.
- **Alternativas consideradas:** (a) `ts-to-zod` (codegen de Zod desde tipos TS): los retornos de los mappers son tipos anónimos inferidos, no interfaces nombradas → frágil y con paso de build extra. (b) Documentación a mano (status quo): diverge. (c) Reflexión en runtime: no produce OpenAPI fiable. Se descartan todas.

### Decisión 2 — Librería: `zod-openapi`
Genera el documento OpenAPI 3.1 desde schemas Zod e integra de forma natural con Express. Compatible con Zod 4.
- **Alternativas:** `@asteasolutions/zod-to-openapi` (obliga a un registry paralelo que re-declara rutas → menos DRY); `swagger-jsdoc` (anotaciones JSDoc mantenidas a mano → diverge). Se descartan.

### Decisión 3 — Helper de ruta que monta Express **y** registra OpenAPI
Un wrapper sobre el `Router` de Express expone los verbos (`get/post/put/patch/delete`) recibiendo, además del handler, la metadata (summary, tags, request schema, response schema por código, auth, errores). El wrapper monta la ruta real y, en paralelo, alimenta el registry OpenAPI. Así `routes.ts` sigue siendo la **única** declaración de cada ruta.
- Las responses se documentan a nivel de **tipo** (`z.infer`), no se parsean en runtime: evita overhead por request y un punto de falla en caliente. La garantía de fidelidad la da el compilador, no el runtime.
- **Alternativa:** registry paralelo (Decisión 2) — duplica rutas. Descartada.

### Decisión 4 — UI: Scalar (`@scalar/express-api-reference`)
La UI debe permitir a terceros **ver y probar** la API, y funcionar sea cual sea el entorno de prod (aún no confirmado). Scalar cumple ambos: tiene "Try it out" gratuito y se entrega como un bundle único que anda igual en serverless o en servidor tradicional.
- Se sirve la UI en `GET /docs` y el documento crudo en `GET /docs/openapi.json` (raíz, fuera de `API_PREFIX`, como `/health`).
- **Alternativas:** `swagger-ui-express` (sirve muchos assets estáticos → fricción si prod resulta serverless; UI anticuada); **Redoc open-source** (limpio pero **sin "Try it out"**, solo lectura → no permite que un tercero pruebe los endpoints). Ambas descartadas.

### Decisión 5 — Seguridad y servers del documento
Se registra una vez un security scheme `bearerAuth` (JWT). Las rutas montadas con `verifyToken` lo referencian. El campo `servers` del documento se construye desde `env.API_PREFIX` para que el "Try it out" apunte al prefijo correcto.

### Decisión 6 — Piloto = módulo `dashboard`, contrato existente intacto
Se implementa el patrón end-to-end en el módulo `dashboard` (4 sub-recursos), porque es la superficie de integración con terceros que se quiere exponer primero y su doc puede ser abierta. Beneficio: al ser read-only y sin auth, el piloto **no necesita resolver el security scheme JWT** todavía. Costo: el `dashboard` usa claves en inglés y no tiene request body, así que los casos "ruta autenticada" y "request body documentado" no se ejercitan en el piloto y quedan para la migración posterior de `auth` + un CRUD. Los módulos no migrados simplemente no aparecen en la doc; no se rompe nada. `docs/api/contracts-rol.md` se deprecará por módulo a medida que se migra.

## Risks / Trade-offs

- **Compatibilidad Zod 4 ↔ zod-openapi** → Validar en el piloto que la versión de `zod-openapi` soporta Zod 4; si no, fijar versión compatible o evaluar el `.openapi()` nativo. Es un spike temprano dentro del piloto.
- **Esfuerzo de escribir response schemas (~2-5 por módulo)** → Mitigado por el alcance incremental: solo el piloto en este cambio; el resto se prorratea.
- **El `z.infer` solo cubre la forma estática, no el contenido en runtime** → Aceptado: si un valor real no cumple, no lo detecta la doc. Los tests de contrato existentes (supertest) siguen siendo la red de runtime.
- **Doc parcial durante la migración** (riesgo de confundir a terceros con una doc incompleta) → Mitigado marcando el estado en la descripción del documento y completando módulos pronto.
- **Bundle/serverless de la UI** → Mitigado al elegir Scalar/Redoc (bundle único) y validarlo en el deploy del piloto.
- **Drift del helper respecto al middleware de auth** (que el helper diga "requiere JWT" pero la ruta no lo monte, o viceversa) → Mitigado haciendo que el helper sea el que aplica el middleware de auth cuando se declara `auth: true`, en vez de declararlo en dos lugares.

## Migration Plan

1. Spike: instalar `zod-openapi` + Scalar; verificar compatibilidad con Zod 4 y arranque de la UI en `/docs` con un documento mínimo.
2. Construir `shared/openapi/` (registry + ensamblado + servers desde `API_PREFIX`; el security scheme JWT se registra pero no se ejercita aún) y el helper de ruta documentada.
3. Migrar el módulo `dashboard` (4 sub-recursos `seekers`/`clients`/`commercial`/`project`): agregar response schemas, tipar mappers con `z.infer`, reescribir cada `routes.ts` con el helper. Todas son rutas públicas read-only.
4. Validar: `tsc` + lint + tests verdes; revisar `/docs` manualmente con "Try it out" sobre los 4 recursos.
5. Deploy de verificación en el entorno de prod (sea cual sea): confirmar que `/docs` carga.
6. Documentar el patrón en `docs/context.md` y abrir el camino para migrar `auth` + CRUD en cambios siguientes.

**Rollback:** el cambio es aditivo; revertir = quitar dependencias, `shared/openapi/`, el montaje de `/docs`, y volver los mappers/routes piloto a su forma previa. No afecta datos ni contrato de runtime.

## Open Questions

- **¿Versión exacta de `zod-openapi` compatible con Zod 4.4.x?** A resolver en el spike inicial.
- **Cuando se migre `auth`:** confirmar si `/docs` completo (con rutas internas) se expone abiertamente o detrás de auth. En el piloto no aplica: solo se documenta `dashboard`, que ya es público.

**Cerradas en esta revisión:**
- ~~Scalar vs Redoc~~ → **Scalar** (Decisión 4): único con "Try it out" gratuito y bundle portable a cualquier deploy.
- ~~`/docs` abierto o detrás de auth~~ → **abierto, solo para `dashboard`** (la superficie de terceros). El resto se decide al migrar `auth`.
