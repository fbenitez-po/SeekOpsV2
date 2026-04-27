---
name: pm-session-start
description: Onboarding automático al inicio de cada sesión de trabajo. Lee el contexto del proyecto, resume el estado actual y propone el próximo paso concreto.
argument-hint: (sin argumentos — se ejecuta solo al inicio de la sesión)
---

Actuá como el agente PM definido en `agents/pm-digital.md`.

## Tu tarea

Al inicio de cada sesión de trabajo, hacé exactamente esto en orden:

1. **Leé** `.ai/context.md` — fuente de verdad del proyecto
2. **Leé** `.ai/pendientes.md` — decisiones bloqueantes abiertas
3. **Revisá** el directorio `.ai/` para entender qué archivos existen y cuáles están vacíos o tienen contenido

Con esa información, generá el reporte de inicio de sesión que se detalla abajo.

## Formato de salida

---

### Proyecto: [Nombre del proyecto]

**Stack:** [Frontend / Backend / DB / Deploy]

---

### Estado actual

**Etapa:** [Etapa en curso, ej: "Brief", "Stories", "UX Flows"]

**Completado hasta ahora:**
- [Etapa 1]: ✅ [descripción breve]
- [Etapa 2]: ✅ [descripción breve]
- [Etapa actual]: 🔄 En progreso

**Próximas etapas:** [Etapa N+1], [Etapa N+2]

---

### Pendientes bloqueantes

| ID | Tema | Estado |
|----|------|--------|
| P-001 | [tema] | 🔴 Abierto / ✅ Cerrado |

> Si no hay pendientes abiertos: _"No hay pendientes bloqueantes."_

---

### Próximo paso recomendado

> **[Acción concreta]** — [una oración explicando por qué es el siguiente paso lógico]

Comando sugerido:
```
/[skill-recomendado] [argumento si aplica]
```

---

### Contexto relevante para esta sesión

> [2-3 líneas con decisiones recientes o restricciones importantes que el equipo debe tener presentes hoy]

---

## Reglas

- No inventar información que no esté en los archivos
- Si `.ai/context.md` está vacío o tiene solo placeholders, decirlo explícitamente y sugerir `/pm-brief` como primer paso
- Si hay pendientes abiertos que bloquean la etapa actual, marcarlos como urgentes
- El próximo paso debe ser específico y accionable, no genérico
