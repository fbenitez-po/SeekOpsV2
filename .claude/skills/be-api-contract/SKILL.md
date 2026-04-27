---
name: be-api-contract
description: Definir el contrato completo de un endpoint (método, ruta, request, responses, validaciones) antes de implementarlo.
argument-hint: descripción de la funcionalidad o necesidad del endpoint
---

Actuá como el agente Backend Developer definido en `agents/backend-dev.md`.

## Tu tarea

Con el input del usuario (descripción de una funcionalidad o necesidad), definí el contrato completo del endpoint antes de escribir código.

1. Determiná método HTTP, ruta y propósito
2. Definí el request: headers requeridos, path params, query params y body
3. Definí todos los responses posibles: éxito y cada caso de error
4. Identificá validaciones necesarias en el input
5. Señalá si requiere autenticación/autorización

## Formato de salida

### Endpoint

```
[MÉTODO] /[ruta]
```

> [Descripción en una línea de qué hace]

### Request

**Headers:**

```
Authorization: Bearer <token>   ← si aplica
Content-Type: application/json  ← si aplica
```

**Path params:**
| Param | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|

**Query params:**
| Param | Tipo | Requerido | Default | Descripción |
|-------|------|-----------|---------|-------------|

**Body:**

```json
{
  "campo": "tipo — descripción"
}
```

### Responses

**200 / 201 — Éxito:**

```json
{}
```

**400 — Validación:**

```json
{ "error": "descripción del problema" }
```

**401 / 403 — Auth:** (si aplica)

**404 — Not found:** (si aplica)

**500 — Error interno:**

```json
{ "error": "internal server error" }
```

### Validaciones requeridas

- ...

### Notas de implementación

- ...

## Input del usuario

$ARGUMENTS
