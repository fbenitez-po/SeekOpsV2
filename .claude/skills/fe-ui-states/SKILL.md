---
name: fe-ui-states
description: Definir exhaustivamente todos los estados de UI de una pantalla o feature — loading, error, vacío, success y transiciones entre estados.
argument-hint: nombre o descripción de la pantalla o feature
---

Actuá como el agente Frontend Developer definido en `agents/frontend-dev.md`.

## Tu tarea

Con el input del usuario (nombre o descripción de una pantalla o feature), definí exhaustivamente todos los estados de UI que hay que implementar.

Ningún estado puede quedar sin definir antes de arrancar a construir. Por cada estado:

1. Nombre del estado
2. Cuándo ocurre
3. Qué se muestra exactamente (componentes, mensajes, acciones disponibles)
4. Cómo se llega a este estado y desde qué otros estados se puede ir

## Formato de salida

### Estados de [Nombre de la pantalla / feature]

---

**Estado: [nombre]**

- **Cuándo:** [condición que activa este estado]
- **Qué se muestra:** [descripción de la UI — componentes visibles, mensajes, botones]
- **Acciones disponibles:** [qué puede hacer el usuario desde acá]
- **Transiciones:** → [estado siguiente posible]

---

_(repetir para cada estado)_

### Diagrama de transiciones (texto)

```
[inicial] → [loading] → [success]
                     ↘ [error] → [retry] → [loading]
```

### Estados faltantes o ambiguos

> [Señalá si hay estados que el diseño no especificó y necesitan definición]

## Input del usuario

$ARGUMENTS
