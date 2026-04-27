# Workflow — Checklist por etapa

Este archivo ayuda a validar que cada etapa esté 100% lista antes de avanzar.

---

## 🔴 Etapa 1: Brief

**Responsable:** PM/Product Owner

### Checklist

- [ ] `.ai/brief.md` completado:
  - [ ] El problema está definido (qué se resuelve)
  - [ ] La solución está clara (cómo se resuelve)
  - [ ] MVP está acotado (incluido/excluido claro)
  - [ ] Entidades principales identificadas
  - [ ] Roles y flujos clave descritos
  - [ ] Stack confirmado
  - [ ] Métricas de éxito definidas

- [ ] Aprobación explícita:
  - [ ] Equipo de producto ✅
  - [ ] Equipo técnico ✅
  - [ ] Stakeholder/Cliente ✅

### ❌ Bloquear si

- El MVP no tiene límites definidos
- No hay acuerdo en el stack técnico
- Faltan roles o audiencias clave
- Hay bloqueadores sin resolución (ver próximo paso)

---

## 🟡 Etapa 2: Historias de Usuario

**Responsable:** PM / UX Designer

### Checklist

- [ ] `.ai/stories/` completado:
  - [ ] `README.md` con índice de todas las historias
  - [ ] Archivo por epic (`epic-01-rol.md`, `epic-02-rol.md`, etc.)
  - [ ] Cada historia tiene:
    - [ ] ID (US-001, US-002, etc.)
    - [ ] Título descriptivo
    - [ ] Criterios Given/When/Then
    - [ ] Casos alternativos (si aplica)

- [ ] Validación:
  - [ ] Todas las historias cubren todos los roles
  - [ ] Las historias son independientes (no bloquean unas a otras)
  - [ ] No hay overlaps entre historias
  - [ ] Cada historia tiene prioridad asignada

- [ ] Aprobación:
  - [ ] Cliente revisa y aprueba historias ✅
  - [ ] Equipo técnico revisa factibilidad ✅

### ❌ Bloquear si

- Hay historias sin criterios claros (Given/When/Then incompleto)
- Historias con más de 20 puntos (están muy grandes)
- Faltan historias para algún rol

---

## 🟠 Etapa 3: UX Flows (User Flows)

**Responsable:** UX Designer

### Checklist

- [ ] `.ai/ux/flows/` completado:
  - [ ] Un archivo por rol (`rol-flows.md`)
  - [ ] Cada flujo tiene:
    - [ ] Nombre descriptivo (F-01, F-02, etc.)
    - [ ] Happy path en diagrama/pasos
    - [ ] Flujos alternativos (si aplica)
    - [ ] Fricciones y puntos de decisión
    - [ ] Pantallas involucradas (S-XXa, S-XXb, etc.)

- [ ] Validación:
  - [ ] Flujos cubren 100% de las historias de usuario
  - [ ] Flujos están validados con el cliente (cambios en flujos son baratos aquí)
  - [ ] No hay loops infinitos o flujos atrapados

### ❌ Bloquear si

- Hay historias sin flujo definido
- Flujos son contradictorios entre roles
- Faltan fricciones importantes

---

## 🟠 Etapa 4: UX Screens (Especificación de pantallas)

**Responsable:** UX Designer

### Checklist

- [ ] `.ai/ux/screens/` completado:
  - [ ] Una pantalla por archivo (`s00-login.md`, `s01-home.md`, etc.)
  - [ ] Cada pantalla tiene:
    - [ ] Metadata (ID, nombre, rol, flujos que usa)
    - [ ] Layout desktop (1366px) con ASCII o descripción
    - [ ] Componentes principales listados
    - [ ] Estados (loading, success, empty, error)
    - [ ] Interacciones (click, submit, validaciones)
    - [ ] Responsive (tablet, mobile)
    - [ ] Notas y restricciones

- [ ] Validación:
  - [ ] Todas las pantallas de los flujos tienen screen spec
  - [ ] No hay pantallas huérfanas
  - [ ] Responsive cubre los breakpoints necesarios

### ❌ Bloquear si

- Pantallas sin estados definidos
- Falta responsive para un breakpoint crítico
- Hay inconsistencia visual entre pantallas

---

## 🟠 Etapa 5: Preview UX

**Responsable:** Frontend Developer / Designer

### Checklist

- [ ] HTML/CSS estático generado:
  - [ ] Todas las pantallas tienen HTML mockup
  - [ ] Identidad visual del cliente aplicada (colores, tipografía, logos)
  - [ ] Estados visualizados (loading spinners, error messages, empty states)
  - [ ] Responsive en mobile/tablet/desktop
  - [ ] Sin JavaScript (solo HTML/CSS)

- [ ] Validación:
  - [ ] Cliente revisa visualmente y aprueba ✅
  - [ ] UX Designer valida contra specs (`/ux-design-review`)
  - [ ] Feedback recibido y ajustado

### ❌ Bloquear si

- Cliente rechaza el diseño visual
- Hay inconsistencias visuales entre pantallas
- Responsive no funciona en algún breakpoint

---

## 🟢 Etapa 6: Specification Summary

**Responsable:** Backend / Tech Lead

### Checklist

- [ ] `.ai/SPECIFICATION-SUMMARY.md` completado:
  - [ ] **Formularios por rol:**
    - [ ] Seeker (todos los campos + validaciones)
    - [ ] Gestor (todos los campos + validaciones)
    - [ ] Admin (todos los campos + validaciones)
  
  - [ ] **Por cada formulario:**
    - [ ] Endpoint HTTP (método, ruta)
    - [ ] Tabla de campos (nombre, tipo, requerido, validación)
    - [ ] Ejemplo de request/response
    - [ ] Reglas de negocio asociadas
  
  - [ ] **Secciones globales:**
    - [ ] Validaciones comunes (email, documento, teléfono, fechas, etc.)
    - [ ] Estados y transiciones de cada entidad
    - [ ] Campos de auditoría (creado_en, actualizado_por, etc.)
    - [ ] Constraints de BD (unique, foreign keys, soft deletes)
    - [ ] Tabla resumen de endpoints

- [ ] Validación:
  - [ ] Todas las historias de usuario están representadas
  - [ ] Todos los campos de pantallas especificadas están incluidos
  - [ ] Sin contradicciones con historias/flows/screens
  - [ ] Validaciones son replicables en Backend + Frontend

- [ ] Uso:
  - [ ] Backend usa como guía para implementar endpoints
  - [ ] Frontend usa como guía para validar formularios
  - [ ] BD Schema incorpora todas las restricciones documentadas

### ❌ Bloquear si

- Hay campos en pantallas que no están documentados
- Las validaciones son ambiguas
- Faltan ejemplos de request/response
- No está sincronizado con historias de usuario

---

## 🔵 Etapa 7: Resolver Pendientes

**Responsable:** PM / Tech Lead

### Checklist

- [ ] `.ai/pendientes.md` revisado:
  - [ ] Cada pendiente (P-001, P-002, etc.) está:
    - [ ] Documentado (tema, impacto, responsable)
    - [ ] Decidido (cerrado) o explícitamente pospuesto
  - [ ] Si pospuesto: documentar dónde se retoma

- [ ] Decisiones tomadas:
  - [ ] Autenticación definida (usuario/pass, OAuth, etc.)
  - [ ] Email/Notificaciones resuelto
  - [ ] Validaciones y reglas de negocio claras
  - [ ] Escalas y límites definidos (max usuarios, transacciones/hora, etc.)
  - [ ] Seguridad y privacidad revisadas

- [ ] Aprobación:
  - [ ] Tech lead aprueba decisiones técnicas ✅
  - [ ] PM aprueba decisiones de producto ✅

### ❌ Bloquear si

- Hay pendientes sin cerrar que bloquean desarrollo
- Las decisiones no están documentadas en `.ai/context.md`

---

## 🟢 Etapa 8: Database Schema

**Responsable:** Backend/DB Architect

### Checklist

- [ ] `.ai/db/schema.md` completado:
  - [ ] Diagrama ER dibujado (o pseudocódigo ASCII)
  - [ ] Todas las tablas definidas con:
    - [ ] Columnas con tipos
    - [ ] Claves primarias
    - [ ] Claves foráneas
    - [ ] Constraints (NOT NULL, UNIQUE, CHECK, etc.)
    - [ ] Índices con justificación

- [ ] Decisiones documentadas:
  - [ ] Por qué UUID vs serial
  - [ ] Por qué esa relación (1:N, M:N) vs otra
  - [ ] Soft delete sí/no, por qué
  - [ ] Auditoría sí/no, por qué
  - [ ] Timezone handling

- [ ] Validación:
  - [ ] Tech lead revisa schema
  - [ ] Cobertura: 100% de entidades de brief

### ❌ Bloquear si

- Faltan tablas para alguna entidad del brief
- Hay relaciones contradictorias
- No hay plan de migraciones (up/down)

---

## 🟢 Etapa 9: API Contracts

**Responsable:** Backend Developer

### Checklist

- [ ] `.ai/api/` completado:
  - [ ] Un archivo por rol (`contracts-seeker.md`, `contracts-manager.md`, etc.)
  - [ ] Cada endpoint tiene:
    - [ ] Método HTTP (GET, POST, PATCH, DELETE)
    - [ ] Ruta clara (`/me/profile`, `/projects/:id`, etc.)
    - [ ] Request (body, query params, headers)
    - [ ] Response 200 OK (estructura completa)
    - [ ] Errores posibles (400, 401, 403, 404, 409, 429, 500)
    - [ ] Validaciones por campo
    - [ ] Autenticación requerida sí/no

- [ ] Mocks JSON generados:
  - [ ] `./api/mocks/` con un archivo por endpoint
  - [ ] Mocks incluyen todos los casos (success, error, empty)
  - [ ] Frontend puede usar mocks inmediatamente

- [ ] Validación:
  - [ ] Backend review (`/be-api-review`)
  - [ ] Cobertura: 100% de historias cubiertas
  - [ ] Frontend puede avanzar con mocks

### ❌ Bloquear si

- Endpoints sin errores definidos
- Mocks no reflejan la estructura del contrato
- Hay endpoints contradictorios

---

## 🟢 Etapa 10: Código

**Responsable:** Frontend / Backend Teams

### Checklist (antes de empezar a codificar)

- [ ] Entorno local listo:
  - [ ] Node/Python/Go instalado
  - [ ] Base de datos local running
  - [ ] Variables de entorno configuradas

- [ ] Convenciones definidas:
  - [ ] Idioma del código (en `CLAUDE.md`)
  - [ ] Estilo de nombres (`camelCase`, `snake_case`, etc.)
  - [ ] Estilo de código (eslint, prettier configs)
  - [ ] Branching strategy (main, develop, feature branches)
  - [ ] PR template / Code review guidelines

- [ ] Todo lo anterior está ✅:
  - [ ] Brief aprobado
  - [ ] Historias validadas
  - [ ] Flujos validados
  - [ ] Screens validados
  - [ ] Preview UX aprobado
  - [ ] Pendientes cerrados
  - [ ] DB schema listo
  - [ ] API contracts listos
  - [ ] Mocks funcionales

### Durante el código

- [ ] **Testing — Backend:**
  - [ ] Unit tests para cada función de servicio (`services/`)
  - [ ] Unit tests para utilidades y helpers
  - [ ] Integration tests por endpoint (happy path + errores definidos en contratos)
  - [ ] Tests de autenticación/autorización (qué pasa si no hay token, si el rol es incorrecto)
  - [ ] Tests de validación de inputs (campos requeridos, formatos, límites)
  - [ ] Coverage mínimo definido: ____% (completar en proyecto)

- [ ] **Testing — Frontend:**
  - [ ] Unit tests de custom hooks con lógica compleja
  - [ ] Tests de componentes críticos (formularios, listas, estados de error)
  - [ ] E2E tests de flujos críticos del happy path (Playwright o Cypress)
  - [ ] E2E tests de flujos de error más frecuentes
  - [ ] Tests de responsiveness en breakpoints definidos (si hay E2E)

- [ ] **Criterios de calidad:**
  - [ ] Todos los tests pasan en CI antes de merge
  - [ ] No hay tests skipped sin justificación documentada
  - [ ] Los mocks de tests reflejan los contratos de API reales
  - [ ] Tests corren en menos de [X] segundos (definir límite en proyecto)

- [ ] Documentación:
  - [ ] Code comments para lógica compleja
  - [ ] API docs generadas (Swagger/OpenAPI si aplica)
  - [ ] README de setup local con comando para correr tests

### Antes de merge a main

- [ ] Code review aprobado ✅
- [ ] Tests passing 100% en CI
- [ ] Coverage mínimo alcanzado
- [ ] Linter sin errores
- [ ] No hay console.log/debug code
- [ ] Commit messages claros

### ❌ Bloquear si

- Hay endpoints sin integration tests
- E2E no cubre el happy path de ningún flujo crítico
- Coverage por debajo del mínimo definido

---

## 📋 Resumen visual

```
Brief (aprobado)
    ↓
Historias (validadas)
    ↓
UX Flows (validados con cliente)
    ↓
UX Screens (especificadas)
    ↓
Preview UX (cliente aprueba visualmente)
    ↓
Specification Summary (referencia técnica centralizada)
    ↓
Resolver Pendientes (0 bloqueadores)
    ↓
DB Schema (listo para migraciones)
    ↓
API Contracts + Mocks (frontend usa mocks)
    ↓
Código (desarrollo paralelo BE/FE)
    ↓
QA / Deploy
```

---

## ⚠️ Notas importantes

1. **Aprobaciones explícitas:** Cada etapa requiere sign-off. No avances sin aprobación.
2. **Cliente en el loop:** Especialmente en Brief, Flows, Screens y Preview UX.
3. **Documentación es código:** Si no está en `.ai/`, no existe.
4. **No saltes etapas:** Cambiar screens en código es 10x más caro que cambiarlas en specs.

---

