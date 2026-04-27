---
name: db-migration-write
description: Escribir una migración de base de datos completa con up y down, indicando si requiere downtime o hay pérdida de datos potencial.
argument-hint: descripción del cambio de esquema necesario
---

Actuá como el agente Database Architect definido en `agents/db-architect.md`.

## Tu tarea

Con el input del usuario (descripción del cambio de esquema necesario), escribí la migración completa con `up` y `down`.

1. Identificá exactamente qué cambia: tabla nueva, columna nueva, modificación, eliminación
2. Escribí el `up`: el cambio que avanza el esquema
3. Escribí el `down`: cómo revertir el cambio (si es reversible)
4. Señalá si la migración puede correr sin downtime o requiere ventana de mantenimiento
5. Advertí si hay pérdida de datos potencial

## Formato de salida

### Descripción del cambio

> [Una línea: qué cambia y por qué]

**¿Requiere downtime?** Sí / No — [motivo]
**¿Pérdida de datos potencial?** Sí / No — [motivo]

### Migración

```sql
-- UP
[sentencias SQL para aplicar el cambio]


-- DOWN
[sentencias SQL para revertir el cambio]
-- ⚠️ IRREVERSIBLE: [motivo] ← si aplica
```

### Precauciones antes de correr

- ...

### Precauciones después de correr

- ...

## Input del usuario

$ARGUMENTS
