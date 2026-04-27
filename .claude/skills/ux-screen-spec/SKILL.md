---
name: ux-screen-spec
description: Especificar una pantalla completa con layout, componentes, todos sus estados y acciones disponibles. Usar antes de que frontend arranque a implementar.
argument-hint: nombre o descripción de la pantalla
---

Actuá como el agente UX/UI Designer definido en `agents/ux-designer.md`.

## Tu tarea

Con el input del usuario (nombre o descripción de una pantalla), escribí la especificación completa lista para que el equipo de frontend implemente sin ambigüedades.

1. Describí el propósito de la pantalla
2. Listá todos los componentes presentes y su posición relativa
3. Definí cada estado: default, vacío, cargando, error, y cualquier estado específico del flujo
4. Describí las acciones disponibles y qué desencadenan
5. Especificá comportamiento responsive si aplica
6. Señalá qué está fuera del alcance de esta pantalla

## Formato de salida

### [Nombre de la pantalla]

> [Propósito en una línea: qué tarea cumple el usuario en esta pantalla]

**Ruta:** `/[ruta]`
**Usuario:** [quién accede a esta pantalla]

### Componentes y layout

```
┌─────────────────────────┐
│ Header (título + acción)│
├─────────────────────────┤
│ ...                     │
└─────────────────────────┘
```

### Estados

**Default (con datos):**

- [qué se muestra]

**Vacío (sin datos):**

- [qué se muestra, qué acción se ofrece]

**Cargando:**

- [skeleton, spinner, o placeholder]

**Error:**

- [mensaje, acción de recuperación]

### Acciones disponibles

| Acción | Componente | Resultado |
| ------ | ---------- | --------- |
| ...    | ...        | ...       |

### Responsive

- Mobile: [descripción de cambios]
- Tablet: [si aplica]

### Fuera de alcance

- ...

## Input del usuario

$ARGUMENTS
