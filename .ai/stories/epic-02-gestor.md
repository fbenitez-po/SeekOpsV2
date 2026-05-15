# Epic 02 — Gestor: Aprobación y Observaciones

---

## US-201: Ver horas pendientes de aprobación del equipo

### Historia de usuario

Como Gestor, quiero ver todas las horas del equipo que están pendientes de mi aprobación, para revisar y procesar a tiempo.

### Criterios de aceptación

- **Given** estoy en el home **When** hago clic en "Horas pendientes" **Then** veo lista de horas con estado "Pendiente" de todos los seekers asignados a mis proyectos

- **Given** veo la lista **When** aplico filtro por "Proyecto" **Then** veo solo horas de ese proyecto

- **Given** veo la lista **When** aplico filtro por "Seeker" **Then** veo solo horas de ese empleado

- **Given** veo la lista **When** hago clic en una fila **Then** veo detalle: semana, proyecto, seeker, horas, horas extra, comentario del seeker

### Supuestos y riesgos

- Un gestor solo ve horas de sus proyectos asignados
- Si el gestor es Seeker en otro proyecto, sus propias horas aparecen en esta lista cuando estén pendientes

### Estado

✅ Lista para desarrollo

---

## US-005: Aprobar horas de un seeker

### Historia de usuario

Como Gestor, quiero aprobar las horas registradas por un seeker, para confirmar que son correctas.

### Criterios de aceptación

- **Given** estoy viendo horas pendientes **When** hago clic en "Aprobar" en una fila **Then** se abre modal de confirmación

- **Given** confirmo la aprobación **When** hago clic en "Sí, aprobar" **Then** el estado cambia a "Aprobado" y desaparece de pendientes

- **Given** he aprobado horas **When** visualizo el historial **Then** aparecen con estado "Aprobado" y fecha de aprobación

- **Given** he aprobado horas **When** el seeker las visualiza **Then** aparecen con estado "Aprobado"

### Supuestos y riesgos

- Una vez aprobadas, las horas no se pueden desaprobar (son definitivas)
- El seeker recibe un email notificándole que sus horas fueron aprobadas

### Estado

✅ Lista para desarrollo

---

## US-006: Observar horas y solicitar corrección

### Historia de usuario

Como Gestor, quiero señalar un error en las horas del seeker y pedir corrección, para mantener precisión en los registros.

### Criterios de aceptación

- **Given** estoy viendo horas pendientes **When** hago clic en "Observar" **Then** se abre formulario con campo "Comentario (obligatorio)"

- **Given** escribo un comentario **When** hago clic en "Enviar observación" **Then** el estado cambia a "Observado" y se guarda el comentario

- **Given** observé horas **When** el seeker las visualiza **Then** aparecen con estado "Observado" y el comentario visible

- **Given** el seeker ajustó las horas **When** regresan a pendientes **Then** recibo un email notificándome que hay horas ajustadas para revisar nuevamente

### Supuestos y riesgos

- La notificación al seeker se envía por email automáticamente
- El ciclo observación → ajuste → re-aprobación puede repetirse varias veces

### Estado

✅ Lista para desarrollo

---

## US-007: Rechazar horas

### Historia de usuario

Como Gestor, quiero rechazar las horas si detecto un error fundamental que requiere recargar desde cero, para mantener la integridad de los registros.

### Criterios de aceptación

- **Given** estoy viendo horas pendientes **When** hago clic en "Rechazar" **Then** se abre modal con campo "Razón del rechazo (obligatorio)"

- **Given** escribo la razón **When** hago clic en "Rechazar" **Then** el estado cambia a "Rechazado"

- **Given** rechacé horas **When** el seeker las visualiza **Then** aparecen como "Rechazado" con la razón visible y sin opción de editar

- **Given** horas fueron rechazadas **When** el seeker quiere cargar nuevas horas **Then** puede crear una nueva entrada (la rechazada queda como histórico)

### Supuestos y riesgos

- El rechazo es definitivo y no reversible
- El seeker recibe email notificándole que sus horas fueron rechazadas con la razón
- Las horas rechazadas no cuentan para nómina (definición post-MVP)

### Estado

✅ Lista para desarrollo

---

## US-008: Registrar mis propias horas como Gestor

### Historia de usuario

Como Gestor, quiero registrar mis propias horas trabajadas en mi proyecto asignado, porque también soy seeker en ese proyecto.

### Criterios de aceptación

- **Given** estoy autenticado como Gestor **When** accedo al formulario de carga de horas **Then** veo mis proyectos asignados como Seeker (además de aquellos donde soy Gestor)

- **Given** cargo horas en un proyecto donde soy Seeker **When** guardo **Then** las horas se guardan con estado "Pendiente de aprobación"

- **Given** soy Seeker Y Gestor en el mismo proyecto **When** mis horas llegan a la bandeja de pendientes **Then** puedo auto-aprobarlas (porque soy el gestor de ese proyecto)

- **Given** me auto-aprobé **When** visualizo el historial **Then** aparecen con estado "Aprobado" y mi nombre como quien las aprobó

### Supuestos y riesgos

- Un usuario puede tener múltiples roles en múltiples proyectos
- La auto-aprobación es permitida (no es un conflicto)

### Estado

✅ Lista para desarrollo

---

## US-209: Registrar proyecciones de horas para mi equipo

### Historia de usuario

Como Gestor, quiero registrar rangos de horas proyectadas para los seekers de mi equipo en cada proyecto, para anticipar desviaciones antes de que ocurran.

### Criterios de aceptación

- **Given** estoy en el home como Gestor **When** hago clic en "Proyecciones" en un proyecto **Then** veo el listado de proyecciones vigentes para ese proyecto con: seeker, fechas del rango, horas proyectadas y categoría (si aplica)

- **Given** hago clic en "Nueva proyección" **When** completo el formulario con: seeker (dropdown de mi equipo), fecha inicio, fecha fin, horas proyectadas, categoría de ingreso (opcional) **Then** la proyección se guarda y aparece en el listado

- **Given** las horas reales del seeker superan las proyectadas en el rango **When** accedo al Home del Gestor **Then** veo una alerta indicando el nombre del seeker, el proyecto y la desviación

- **Given** edito una proyección existente **When** cambio las horas proyectadas y guardo **Then** la proyección se actualiza y la alerta de desviación se recalcula

- **Given** el rango de fechas de una proyección ya pasó **When** veo el listado **Then** aparece marcada como "Finalizada" y sin alerta activa

### Supuestos y riesgos

- Las proyecciones son por seeker + proyecto + rango de fechas (no por semana individual)
- Las horas proyectadas se expresan en incrementos de 0.5 horas
- `categoria_id` es opcional — si no se especifica, la proyección aplica a todas las categorías del proyecto
- El endpoint de alertas es `GET /projections/alertas` y solo devuelve desviaciones activas (rango vigente + horas reales > horas proyectadas)

### Estado

✅ Lista para desarrollo
