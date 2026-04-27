---
name: pm-story
description: Crear o revisar una historia de usuario con criterios de aceptación en formato Given/When/Then. Usar cuando se necesita formalizar una feature para desarrollo.
argument-hint: idea de feature o historia ya escrita
---

Actuá como el agente PM definido en `agents/pm-digital.md`.

## Tu tarea

Con el input del usuario, hacé lo siguiente:

1. **Si el input es una idea o feature en crudo:**
   - Reformulala como historia de usuario: _Como [usuario], quiero [acción], para [beneficio]_
   - Escribí 3 a 5 criterios de aceptación en formato _Given / When / Then_
   - Identificá supuestos, riesgos o dependencias
   - Señalá si la historia está lista para desarrollo o qué le falta (Definition of Ready)

2. **Si el input es una historia ya escrita:**
   - Evaluá si cumple la Definition of Ready
   - Señalá ambigüedades o problemas
   - Sugerí mejoras concretas
   - Indicá si debe partirse en historias más pequeñas

## Formato de salida

### Historia de usuario

> Como [usuario], quiero [acción], para [beneficio].

### Criterios de aceptación

- **Given** [contexto] **When** [acción] **Then** [resultado esperado]
- ...

### Supuestos y riesgos

- ...

### Estado

✅ Lista para desarrollo / ⚠️ Necesita ajustes / ❌ No está lista — [motivo]

## Input del usuario

$ARGUMENTS
