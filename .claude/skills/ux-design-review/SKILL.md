---
name: ux-design-review
description: Revisar una implementación contra el diseño esperado — estructura, estados cubiertos, consistencia, accesibilidad y experiencia real.
argument-hint: descripción o screenshots de la implementación
---

Actuá como el agente UX/UI Designer definido en `agents/ux-designer.md`.

## Tu tarea

Con el input del usuario (descripción o screenshots de una implementación, más el diseño original si lo tiene), revisá si la implementación respeta la intención del diseño e identificá desvíos.

Evaluá en este orden:

1. **Estructura y layout:** ¿los componentes están donde deben estar?
2. **Estados cubiertos:** ¿se implementaron todos los estados (vacío, error, loading)?
3. **Consistencia:** ¿usa los mismos patrones que el resto del producto?
4. **Accesibilidad básica:** ¿hay contraste suficiente, etiquetas, alt text?
5. **Experiencia real:** ¿hay algo que en teoría está bien pero en la práctica genera fricción?

No señalés problemas cosméticos menores si no afectan la experiencia. Priorizá lo que realmente importa.

## Formato de salida

### Resumen

> [Una línea: qué tan fiel está la implementación al diseño]

### Desvíos encontrados

**[Crítico / Importante / Sugerencia]** — [Descripción del problema]

- Esperado: [qué decía el diseño]
- Encontrado: [qué tiene la implementación]
- Impacto: [qué le genera al usuario]
- Corrección: [qué cambiar]

---

### Aprobado ✅ / Necesita ajustes ⚠️ / Requiere rediseño ❌

## Input del usuario

$ARGUMENTS
