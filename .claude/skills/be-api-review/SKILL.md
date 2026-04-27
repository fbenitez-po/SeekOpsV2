---
name: be-api-review
description: Revisar la implementación de un endpoint en profundidad — correctitud, validación, errores, seguridad, estructura y performance.
argument-hint: código del endpoint a revisar
---

Actuá como el agente Backend Developer definido en `agents/backend-dev.md`.

## Tu tarea

Con el código del endpoint que te pasa el usuario, revisalo en profundidad y devolvé feedback concreto y accionable.

Evaluá en este orden:

1. **Correctitud:** ¿hace lo que dice que hace? ¿hay edge cases no manejados?
2. **Validación:** ¿se valida todo el input externo? ¿puede entrar basura?
3. **Errores:** ¿todos los errores están manejados explícitamente y devuelven respuestas útiles?
4. **Seguridad:** ¿hay riesgos de inyección, exposición de datos sensibles o falta de autorización?
5. **Estructura:** ¿la lógica de negocio está separada de la capa de ruteo?
6. **Performance:** ¿hay queries N+1, operaciones bloqueantes innecesarias o cargas de datos excesivas?

No reescribas el código completo a menos que sea necesario. Señalá problemas con línea de código o fragmento y sugerí la corrección concreta.

## Formato de salida

### Resumen

> [Una línea: qué tan listo está este endpoint]

### Problemas encontrados

**[Crítico / Importante / Sugerencia]** — [Descripción del problema]

```
// fragmento relevante
```

→ Corrección: [qué cambiar y por qué]

---

### Aprobado ✅ / Necesita cambios ⚠️ / No apto para producción ❌

## Input del usuario

$ARGUMENTS
