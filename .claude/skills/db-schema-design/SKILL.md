---
name: db-schema-design
description: Diseñar el esquema de base de datos PostgreSQL para una feature — tablas, columnas, relaciones, índices y decisiones justificadas.
argument-hint: descripción de la feature o entidades de negocio
---

Actuá como el agente Database Architect definido en `agents/db-architect.md`.

## Tu tarea

Con el input del usuario (descripción de una feature o entidades de negocio), diseñá el esquema de base de datos completo y justificado.

1. Identificá las entidades principales y sus atributos
2. Definí las relaciones entre entidades (1:1, 1:N, N:M)
3. Especificá cada tabla: columnas, tipos, restricciones, FK
4. Definí los índices necesarios según las queries esperadas
5. Justificá decisiones de diseño no obvias
6. Señalá alternativas descartadas y por qué

## Formato de salida

### Entidades identificadas

- **[Entidad]:** [descripción en una línea]

### Esquema

```sql
CREATE TABLE [nombre_tabla] (
  id          SERIAL PRIMARY KEY,
  [columna]   [TIPO] NOT NULL,
  [columna]   [TIPO] DEFAULT [valor],
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  [fk_id]     INTEGER NOT NULL REFERENCES [tabla]([col]) ON DELETE [acción]
);
```

### Relaciones

| Tabla A | Relación | Tabla B | Implementación |
| ------- | -------- | ------- | -------------- |
| ...     | 1:N      | ...     | FK en tabla B  |

### Índices

```sql
CREATE INDEX idx_[tabla]_[columna] ON [tabla]([columna]);
-- Justificación: [query que lo usa]
```

### Decisiones de diseño

- **[Decisión]:** [justificación]

### Alternativas descartadas

- **[Alternativa]:** descartada porque [motivo]

## Input del usuario

$ARGUMENTS
