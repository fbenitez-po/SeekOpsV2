---
name: qa-test-plan
description: Definir el plan de testing de una feature — qué testear, en qué nivel (unit/integration/E2E), casos críticos y criterios de cobertura. Usar antes de que el equipo empiece a escribir tests.
argument-hint: feature, endpoint o flujo a cubrir con tests
---

## Tu tarea

Con el input del usuario (una feature, un endpoint, o un flujo de usuario), generá un plan de testing completo antes de que el equipo empiece a escribir los tests.

1. Identificá qué lógica/comportamiento hay que proteger (qué rompería si no hay test)
2. Definí los casos de test por nivel: unit, integration, E2E
3. Señalá los casos críticos (happy path obligatorio) y los casos de riesgo (errores, edge cases)
4. Indicá el orden de implementación recomendado
5. Señalá qué NO testear (mocks de terceros, UI cosmética, etc.)

## Formato de salida

---

### Feature: [nombre]

**Cobertura objetivo:** ____% (completar según política del proyecto)

---

### Qué protege este plan

> [2-3 líneas explicando qué rompería si no hay tests — justificación del esfuerzo]

---

### Casos de test

#### Unit tests
> Cubrir lógica de negocio aislada — funciones, servicios, validaciones.

| ID | Descripción | Entrada | Resultado esperado | Prioridad |
|----|-------------|---------|-------------------|-----------|
| U-01 | [ej: calcula precio con descuento] | [input] | [output] | 🔴 Alta |
| U-02 | ... | ... | ... | ... |

#### Integration tests
> Cubrir la interacción entre capas — endpoints con base de datos real o en memoria.

| ID | Descripción | Setup | Request | Response esperada | Prioridad |
|----|-------------|-------|---------|------------------|-----------|
| I-01 | [ej: POST /orders crea orden y descuenta stock] | [seed] | [body] | [status + body] | 🔴 Alta |
| I-02 | ... | ... | ... | ... | ... |

#### E2E tests
> Cubrir flujos completos desde el punto de vista del usuario.

| ID | Flujo | Pasos | Resultado esperado | Prioridad |
|----|-------|-------|--------------------|-----------|
| E-01 | [ej: usuario completa checkout] | [pasos] | [lo que el usuario ve] | 🔴 Alta |
| E-02 | ... | ... | ... | ... |

---

### Casos de error a cubrir

> Estos son los escenarios donde algo sale mal — deben tener test explícito.

- [ ] Input inválido / campos requeridos faltantes
- [ ] Usuario sin permisos (401 / 403)
- [ ] Recurso no encontrado (404)
- [ ] Conflicto de estado (409)
- [ ] Timeout o servicio externo caído (si aplica)
- [ ] [Agregar casos específicos de la feature]

---

### Qué NO testear

> Scope fuera del plan — para no perder tiempo en tests de bajo valor.

- Estilo visual / posición de elementos (no es E2E)
- Respuestas de APIs de terceros (mockear en su lugar)
- [Otros casos específicos del proyecto]

---

### Orden de implementación

1. Unit tests de la lógica de negocio principal
2. Integration tests del happy path
3. Integration tests de errores críticos
4. E2E del flujo principal
5. E2E de flujos alternativos (si el tiempo lo permite)

---

### Estado

✅ Plan listo para implementar / ⚠️ Necesita definir stack de testing / ❌ Falta información — [motivo]

---

## Input del usuario

$ARGUMENTS
