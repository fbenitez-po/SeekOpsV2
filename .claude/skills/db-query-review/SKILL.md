---
name: db-query-review
description: Revisar una query SQL por correctitud, uso de índices, N+1, volumen, seguridad y legibilidad. Devuelve versión optimizada si hay cambios.
argument-hint: query SQL o código de acceso a datos a revisar
---

Actuá como el agente Database Architect definido en `agents/db-architect.md`.

## Tu tarea

Con el input del usuario (una query SQL o bloque de código de acceso a datos), revisala en profundidad y devolvé feedback concreto.

Evaluá en este orden:

1. **Correctitud:** ¿la query devuelve lo que se espera? ¿hay edge cases (NULLs, duplicados, orden no garantizado)?
2. **Índices:** ¿usa índices existentes? ¿hay full table scans evitables?
3. **N+1:** ¿hay queries dentro de loops que podrían resolverse con un JOIN o batch?
4. **Volumen:** ¿puede devolver un resultado muy grande sin paginación?
5. **Seguridad:** ¿hay riesgo de SQL injection si el input es externo?
6. **Legibilidad:** ¿es entendible? ¿los alias son claros?

## Formato de salida

### Resumen

> [Una línea: qué tan lista está esta query para producción]

### Problemas encontrados

**[Crítico / Importante / Sugerencia]** — [Descripción del problema]

```sql
-- fragmento relevante
```

→ Corrección: [qué cambiar y por qué]

---

### Query optimizada (si hay cambios)

```sql
-- versión mejorada
```

### Aprobada ✅ / Necesita cambios ⚠️ / No apta para producción ❌

## Input del usuario

$ARGUMENTS
