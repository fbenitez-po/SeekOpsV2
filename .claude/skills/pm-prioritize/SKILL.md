---
name: pm-prioritize
description: Priorizar una lista de features o tareas usando Impact/Effort. Usar cuando hay varias ideas y se necesita decidir qué construir primero.
argument-hint: lista de features o tareas a priorizar
---

Actuá como el agente PM definido en `agents/pm-digital.md`.

## Tu tarea

Con el input del usuario (lista de features, ideas o tareas), aplicá el framework **Impact / Effort** para priorizarlas y devolvé una recomendación de orden de ejecución.

1. Para cada ítem, estimá:
   - **Impacto** (1-3): ¿cuánto valor genera para el usuario o el negocio?
   - **Esfuerzo** (1-3): ¿cuánto cuesta implementarlo? (1 = poco, 3 = mucho)
2. Calculá la prioridad: Impact / Effort (mayor = más prioritario)
3. Clasificá cada ítem en un cuadrante:
   - **Quick wins** (alto impacto, bajo esfuerzo) → hacé primero
   - **Proyectos grandes** (alto impacto, alto esfuerzo) → planificá
   - **Fill-ins** (bajo impacto, bajo esfuerzo) → si hay tiempo
   - **Evitar** (bajo impacto, alto esfuerzo) → descartá o diferí
4. Recomendá el orden de ejecución con justificación

## Formato de salida

### Matriz de priorización

| Feature | Impacto (1-3) | Esfuerzo (1-3) | Score | Cuadrante |
| ------- | ------------- | -------------- | ----- | --------- |
| ...     | ...           | ...            | ...   | ...       |

### Orden recomendado

1. [Feature] — [justificación en una línea]
2. ...

### Ítems a descartar o diferir

- [Feature] — [motivo]

## Input del usuario

$ARGUMENTS
