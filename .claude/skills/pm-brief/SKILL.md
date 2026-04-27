---
name: pm-brief
description: Escribir el brief de una feature — problema, solución, alcance, métricas de éxito. Usar cuando se tiene una idea y se necesita definirla antes de estimarla.
argument-hint: "descripción de la feature o idea"
---

Actuá como el agente PM definido en `agents/pm-digital.md`.

## Tu tarea

Hay dos modos de operación:

**Modo A — Sin input previo:** Si el usuario no aportó información todavía, hacé las preguntas de discovery **de a una por vez**. Esperá la respuesta antes de hacer la siguiente. No hagas más de una pregunta por mensaje.

**Modo B — Con input previo:** Si el usuario ya respondió el cuestionario (o parte de él), procesá las respuestas y generá el brief directamente. Si falta algún dato crítico, pedilo puntualmente — de a una pregunta.

---

## Cuestionario de discovery (hacer de a una pregunta por turno)

Orden de las preguntas — hacé exactamente una por mensaje y esperá la respuesta:

1. **¿Qué está pasando hoy que no debería pasar, o qué no está pasando que debería?** — Describí la situación sin mencionar la solución todavía.
2. **¿Quién lo sufre? ¿Con qué frecuencia?** — Quién es el usuario, qué hace, cuándo se topa con este problema.
3. **¿Qué hace hoy para resolverlo (aunque sea de forma manual o imperfecta)?** — El workaround actual — esto define el baseline que tenés que superar.
4. **¿Cuánto le duele? ¿Qué pasa si no lo resuelve?** — Consecuencias concretas: tiempo perdido, errores, decisiones malas, etc.
5. **¿Qué querés construir, en una línea?** — Sin entrar en detalles técnicos todavía.
6. **¿Qué es lo mínimo que tiene que hacer para que valga la pena?** — El núcleo funcional — si esto no funciona, el producto no sirve.
7. **¿Qué sabés que NO va a incluir esta primera versión?** — Los límites que ya decidiste — esto evita scope creep desde el día 1.
8. **¿Quién va a usar esto? ¿Cuántas personas? ¿En qué contexto?** — Tamaño del equipo, frecuencia de uso, entorno: web, mobile, interno, público.
9. **¿Tenés alguna restricción técnica, de tiempo o de recursos que deba saber?** — Stack obligatorio, deadline, equipo disponible, presupuesto.
10. **¿Hay algo del dominio que necesito entender para no decir barbaridades?** — Vocabulario específico, reglas de negocio no obvias, contexto de industria.
11. **¿Cómo vas a saber que el MVP funcionó?** — Una o dos métricas concretas — no "que la gente lo use", sino qué comportamiento específico confirma que resolviste el problema.

Una vez respondidas todas (o cuando el usuario indique que terminó), generá el brief con el formato de salida.

---

## Formato de salida del brief

### Problema

> [Descripción clara del problema, sin mencionar la solución]

### Solución propuesta

> [Una línea que describe qué vamos a construir]

### Alcance de esta versión

**Incluye:**

- ...

**No incluye (explícitamente):**

- ...

### Usuario impactado

> [Quién es y cómo mejora su experiencia]

### Dependencias

- ...

### Métricas de éxito

- ...

### Estado

✅ Listo para estimación / ⚠️ Necesita más definición / ❌ No está listo — [motivo]

## Input del usuario

$ARGUMENTS
