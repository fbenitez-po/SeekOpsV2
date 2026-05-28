## 1. Spike y dependencias

- [x] 1.1 Instalar `zod-openapi` en `apps/api` y verificar compatibilidad con Zod 4.4.x (resolver versión exacta)
- [x] 1.2 Instalar la UI `@scalar/express-api-reference` (Scalar)
- [x] 1.3 Levantar un documento OpenAPI mínimo y servir la UI de Scalar en `/docs` localmente para validar el arranque (smoke del spike)

## 2. Infraestructura compartida (`shared/openapi/`)

- [x] 2.1 Crear el registry OpenAPI y el ensamblado del documento (info, version, tags)
- [x] 2.2 Construir el campo `servers` desde `env.API_PREFIX`
- [x] 2.3 Registrar el security scheme global `bearerAuth` (HTTP bearer / JWT) — queda listo para futuros módulos, no se ejercita en el piloto `dashboard`
- [x] 2.4 Montar la UI de Scalar en `GET /docs` y el documento crudo en `GET /docs/openapi.json` (en la raíz, fuera de `API_PREFIX`, junto a `/health`)

## 3. Helper de ruta documentada

- [x] 3.1 Implementar el wrapper sobre el `Router` de Express que expone `get/post/put/patch/delete` recibiendo handler + metadata (summary, tags, request schema, response schema por código, errores, auth)
- [x] 3.2 Hacer que el helper monte la ruta real en Express y, a la vez, registre la metadata en el registry OpenAPI
- [x] 3.3 Hacer que, cuando `auth: true`, el helper aplique el middleware JWT (`verifyToken`/`adminOnly`) y referencie `bearerAuth` en la doc — auth declarada en un solo lugar
- [x] 3.4 Mapear la jerarquía de errores (`ValidationError` 400, `Unauthorized` 401, `Forbidden` 403, `NotFound` 404, `Conflict` 409) a respuestas OpenAPI reutilizables

## 4. Migración piloto — módulo `dashboard` (superficie de terceros)

- [x] 4.1 Crear response schemas Zod para cada sub-recurso (`seekers`, `clients`, `commercial`, `project`) — claves en inglés (compatibilidad v1), forma del array plano que devuelve cada uno
- [x] 4.2 Tipar los mappers (`dashboard/*/*.mapper.ts`) con `z.infer<typeof ResponseSchema>` de cada sub-recurso
- [x] 4.3 Reescribir los 4 `routes.ts` del `dashboard` con el helper, declarándolos como rutas públicas read-only (sin auth)
- [x] 4.4 Agrupar los 4 recursos bajo un tag OpenAPI común (p. ej. "Dashboard / Integraciones") para que la doc de terceros quede ordenada
- [x] 4.5 Provocar deliberadamente una divergencia mapper↔schema y confirmar que `tsc` falla (valida la garantía del compilador), luego revertir

## 5. Verificación y cierre

- [x] 5.1 `npm run build` (tsc) + `npm run lint` + `npm test` en verde
- [x] 5.2 Validación del documento OpenAPI generado (paths, tags, components, servers, security) vía `tsx`. Nota: el render visual en navegador y el "Try it out" quedan pendientes de revisión manual del usuario (no hay navegador en el entorno de implementación).
- [ ] 5.3 Deploy de verificación en el entorno de prod (sea cual sea): confirmar que `/docs` carga
- [x] 5.4 Documentar el patrón de ruta documentada + response schemas en `docs/context.md` (decisión de arquitectura) y registrar la entrada fechada en `docs/decisions.md`
- [x] 5.5 Marcar `docs/api/contracts-rol.md` como deprecado para el módulo ya migrado (`dashboard`)
