# Epic 02 — Gestor: Aprobación y Observaciones

---

## US-201: Ver solicitudes de horas pendientes por proyecto

### Historia de usuario

Como Gestor, quiero ver las solicitudes de horas pendientes de aprobación de los seekers en mis proyectos, para revisarlas y procesarlas a tiempo.

### Criterios de aceptación

- **Given** estoy en la bandeja del gestor **When** la cargo **Then** veo una solicitud por cada combinación (seeker × semana × proyecto) donde el proyecto es mío y hay líneas en estado PENDIENTE

- **Given** veo la lista **When** aplico filtro por "Proyecto" **Then** veo solo solicitudes de ese proyecto

- **Given** veo la lista **When** aplico filtro por "Seeker" **Then** veo solo solicitudes de ese empleado

- **Given** una entrada tiene dos proyectos distintos con gestores distintos **When** cada gestor ve la bandeja **Then** cada uno solo ve su solicitud (la del otro proyecto no aparece)

### Supuestos y riesgos

- La unidad de aprobación es la **solicitud** = (seeker × semana × proyecto). Un gestor nunca puede aprobar horas de un proyecto que no gestiona.
- El estado por línea (`time_entry_lines.status`) es la fuente de verdad; `time_entries.status` es un rollup derivado.
- Si el gestor es Seeker en sus propios proyectos, sus horas propias aparecen en su bandeja cuando estén PENDIENTE.

### Estado

✅ Lista para desarrollo

---

## US-005: Aprobar horas de un seeker por proyecto

### Historia de usuario

Como Gestor, quiero aprobar las horas registradas por un seeker en mis proyectos, para confirmar que son correctas.

### Criterios de aceptación

- **Given** estoy viendo una solicitud pendiente **When** hago clic en "Aprobar" **Then** se aprueba el bloque de líneas de ese proyecto para esa semana (sin afectar otros proyectos de la misma semana)

- **Given** confirmo la aprobación **When** hago clic en "Sí, aprobar" **Then** las líneas de ese proyecto cambian a APROBADO, la solicitud desaparece de mi bandeja pendiente

- **Given** un seeker tiene dos proyectos en la misma semana **When** apruebo uno **Then** el otro permanece PENDIENTE hasta que su gestor lo procese

- **Given** he aprobado el bloque completo de proyectos de una semana **When** el seeker visualiza esa semana **Then** el rollup de la semana muestra "Aprobado"

### Supuestos y riesgos

- La aprobación es por proyecto dentro de una entrada semanal, usando `proyecto_id` en el body del request.
- Una vez aprobadas, las líneas no se pueden desaprobar (son definitivas).

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

- **Given** observé horas de un proyecto **When** el seeker las visualiza **Then** aparecen con estado APROBADO_CON_OBSERVACION y el comentario del gestor visible

### Supuestos y riesgos

- La observación aplica al bloque de líneas del proyecto indicado (no a toda la semana).
- El ajuste de horas por observación lo controla el gestor al momento de observar (puede modificar horas y extras por línea).

### Estado

✅ Lista para desarrollo

---

## US-007: Rechazar horas

### Historia de usuario

Como Gestor, quiero rechazar las horas si detecto un error fundamental que requiere recargar desde cero, para mantener la integridad de los registros.

### Criterios de aceptación

- **Given** estoy viendo horas pendientes **When** hago clic en "Rechazar" **Then** se abre modal con campo "Razón del rechazo (obligatorio)"

- **Given** escribo la razón **When** hago clic en "Rechazar" **Then** el estado cambia a "Rechazado"

- **Given** rechacé horas de un proyecto **When** el seeker las visualiza en Mis Horas **Then** el proyecto aparece como RECHAZADO dentro de la semana, con la razón visible y un botón "Re-cargar"

- **Given** horas de un proyecto fueron rechazadas **When** el seeker vuelve a cargar ese proyecto para esa semana **Then** puede crear una nueva línea PENDIENTE — la rechazada queda como histórico (is_active=true, status=RECHAZADO)

- **Given** el seeker intenta cargar un proyecto que ya tiene línea PENDIENTE o APROBADO **When** intenta enviar **Then** recibe error de duplicado y no puede enviarlo

### Supuestos y riesgos

- El rechazo es definitivo; la línea rechazada NO se pone en is_active=false (no es baja lógica).
- El guard de duplicados usa índice parcial `(time_entry_id, project_id) WHERE is_active=true AND status<>'RECHAZADO'` — permite re-carga post-rechazo.
- Las horas rechazadas no cuentan para nómina (finanzas suma solo APROBADO y APROBADO_CON_OBSERVACION por línea).

### Estado

✅ Lista para desarrollo

---

## US-008: Registrar mis propias horas como Gestor

### Historia de usuario

Como Gestor, quiero registrar mis propias horas trabajadas en mi proyecto asignado, porque también soy seeker en ese proyecto.

### Criterios de aceptación

- **Given** estoy autenticado como Gestor **When** accedo al formulario de carga de horas **Then** veo mis proyectos asignados como Seeker (además de aquellos donde soy Gestor)

- **Given** cargo horas en un proyecto donde soy Seeker **When** guardo **Then** las horas se guardan con estado "Pendiente" — igual que cualquier otro seeker

- **Given** soy Seeker Y Gestor en el mismo proyecto **When** mis horas llegan a la bandeja de pendientes **Then** aparecen en mi propia bandeja como gestor y debo aprobarlas explícitamente (no hay auto-aprobación)

### Supuestos y riesgos

- Un usuario puede tener múltiples roles en múltiples proyectos
- La auto-aprobación **no está permitida** — todos los gestores también son seekers y deben aprobar sus propias horas manualmente (decisión 2026-05-21)

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
