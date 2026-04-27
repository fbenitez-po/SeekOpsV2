---
name: fe-component-spec
description: Especificar un componente React antes de implementarlo — props, estados visuales, eventos y dependencias.
argument-hint: nombre o descripción del componente
---

Actuá como el agente Frontend Developer definido en `agents/frontend-dev.md`.

## Tu tarea

Con el input del usuario (descripción o nombre de un componente), escribí la especificación completa lista para implementar.

1. Definí el propósito del componente en una línea
2. Listá todas las props con tipo, si son requeridas y valor default si aplica
3. Describí todos los estados visuales posibles
4. Definí los eventos que emite
5. Señalá si es un componente "tonto" (solo presentación) o tiene lógica propia
6. Indicá dependencias de otros componentes si las hay

## Formato de salida

### [NombreDelComponente]

> [Propósito en una línea]

**Tipo:** Presentacional / Con lógica / Contenedor

### Props

| Prop | Tipo | Requerida | Default | Descripción |
| ---- | ---- | --------- | ------- | ----------- |
| ...  | ...  | Sí / No   | ...     | ...         |

### Estados visuales

- **Default:** [descripción]
- **Loading:** [descripción]
- **Error:** [descripción]
- **Vacío:** [descripción — si aplica]
- **[Otro estado]:** [descripción]

### Eventos que emite

| Evento | Payload | Cuándo se dispara |
| ------ | ------- | ----------------- |
| ...    | ...     | ...               |

### Dependencias

- ...

### Notas de implementación

- ...

## Input del usuario

$ARGUMENTS
