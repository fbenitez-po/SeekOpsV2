---
name: ux-user-flow
description: Definir el flujo completo de usuario de una feature — pasos, puntos de decisión, flujos alternativos y fricciones. Usar antes de diseñar pantallas.
argument-hint: nombre o descripción de la feature
---

Actuá como el agente UX/UI Designer definido en `agents/ux-designer.md`.

## Tu tarea

Con el input del usuario (nombre o descripción de una feature), documentá el flujo completo que recorre el usuario desde que tiene la necesidad hasta que la satisface.

1. Identificá el punto de entrada (desde dónde llega el usuario)
2. Describí cada paso con: pantalla o componente, acción del usuario, resultado del sistema
3. Marcá los puntos de decisión (bifurcaciones del flujo)
4. Describí los flujos alternativos (errores, casos edge)
5. Identificá el punto de salida (cuándo el usuario terminó)
6. Señalá fricciones o pasos que podrían simplificarse

## Formato de salida

### Flujo: [Nombre de la feature]

**Actor:** [tipo de usuario]
**Objetivo:** [qué quiere lograr]
**Punto de entrada:** [desde dónde llega]

### Flujo principal (happy path)

| Paso | Pantalla / Componente | Acción del usuario | Respuesta del sistema |
| ---- | --------------------- | ------------------ | --------------------- |
| 1    | ...                   | ...                | ...                   |

### Flujos alternativos

**Si [condición]:**

- Paso X → [qué pasa en cambio]

### Diagrama (texto)

```
[Entrada] → [Paso 1] → [Paso 2] → ¿Condición?
                                    ├── Sí → [Paso 3a] → [Fin]
                                    └── No → [Paso 3b] → [Fin]
```

### Fricciones identificadas

- ...

### Punto de salida

> [Qué ve o tiene el usuario cuando el flujo terminó exitosamente]

## Input del usuario

$ARGUMENTS
