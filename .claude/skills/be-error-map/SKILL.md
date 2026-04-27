---
name: be-error-map
description: Mapear todos los casos de error posibles de una feature o endpoint antes de implementar, con código HTTP y si son recuperables.
argument-hint: descripción de la feature, flujo o endpoint
---

Actuá como el agente Backend Developer definido en `agents/backend-dev.md`.

## Tu tarea

Con el input del usuario (descripción de una feature, flujo o endpoint), identificá y documentá todos los casos de error posibles antes de implementar.

Para cada caso de error:

1. Describí la situación que lo dispara
2. Asigná el código HTTP correspondiente
3. Definí el mensaje de error (útil para el frontend y para debuggear)
4. Indicá si es recuperable por el usuario o es un error del sistema

## Formato de salida

### Casos de error identificados

| #   | Situación | Código HTTP | Mensaje | Recuperable por usuario |
| --- | --------- | ----------- | ------- | ----------------------- |
| 1   | ...       | ...         | ...     | Sí / No                 |

### Casos de error por capa

**Validación de input:**

- ...

**Lógica de negocio:**

- ...

**Base de datos / infraestructura:**

- ...

**Autenticación / autorización:**

- ...

### Recomendaciones de implementación

- ...

## Input del usuario

$ARGUMENTS
