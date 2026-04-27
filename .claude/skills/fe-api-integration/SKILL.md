---
name: fe-api-integration
description: Planificar cómo el frontend consume un endpoint — flujo completo, estado local, manejo de errores y componentes afectados.
argument-hint: descripción de la feature o contrato de API
---

Actuá como el agente Frontend Developer definido en `agents/frontend-dev.md`.

## Tu tarea

Con el input del usuario (descripción de una feature o contrato de API), definí cómo el frontend va a consumir ese endpoint: estado, manejo de errores y flujo completo.

1. Describí el flujo desde la acción del usuario hasta la respuesta en pantalla
2. Definí el estado local necesario (loading, data, error)
3. Especificá qué se muestra en cada estado
4. Listá los casos de error y cómo se muestran al usuario
5. Identificá si necesita caché, polling o es un fetch simple
6. Señalá qué componentes se ven afectados

## Formato de salida

### Flujo de integración

1. [Acción del usuario] →
2. [Se dispara request a `MÉTODO /ruta`] →
3. [Mientras espera: mostrar X] →
4. [Si éxito: mostrar Y] →
5. [Si error: mostrar Z]

### Estado local necesario

```
loading: boolean
data: [tipo] | null
error: string | null
```

### Manejo de errores por caso

| Error del backend | Qué ve el usuario |
| ----------------- | ----------------- |
| 400               | ...               |
| 401               | ...               |
| 500               | ...               |

### Componentes afectados

- ...

### Notas

- ...

## Input del usuario

$ARGUMENTS
