## ADDED Requirements

### Requirement: Estado de aprobación por línea
El sistema SHALL almacenar el estado de aprobación a nivel de cada línea de horas (`time_entry_lines`), con valores `PENDIENTE`, `APROBADO`, `APROBADO_CON_OBSERVACION` o `RECHAZADO`. Toda línea creada por una carga de horas SHALL nacer en estado `PENDIENTE`.

#### Scenario: Líneas nacen pendientes
- **WHEN** un usuario (seeker o gestor) carga horas de una semana con líneas para uno o más proyectos
- **THEN** cada línea creada queda en estado `PENDIENTE`, independientemente de los roles del usuario que carga

#### Scenario: No hay auto-aprobación por rol
- **WHEN** un usuario con rol GESTOR carga sus propias horas
- **THEN** sus líneas quedan `PENDIENTE` y deben ser aprobadas explícitamente (no se auto-aprueban)

### Requirement: Estado de la semana derivado
El sistema SHALL calcular el estado de la semana (`time_entries.status`) como un rollup derivado del estado de sus líneas activas, y SHALL recalcularlo cada vez que cambia el estado de una línea.

#### Scenario: Rollup con estados mixtos prioriza pendiente
- **WHEN** una semana tiene una línea `APROBADO` y otra `PENDIENTE`
- **THEN** el estado derivado de la semana es `PENDIENTE` (mientras quede algo por revisar; no se introduce un estado nuevo)

#### Scenario: Rollup con rechazo y sin pendientes
- **WHEN** una semana no tiene líneas `PENDIENTE` pero tiene al menos una `RECHAZADO`
- **THEN** el estado derivado de la semana es `RECHAZADO` (la semana espera la re-carga del seeker)

#### Scenario: Rollup totalmente aprobado
- **WHEN** todas las líneas activas de una semana están en `APROBADO` o `APROBADO_CON_OBSERVACION`
- **THEN** el estado derivado de la semana es aprobado

### Requirement: Alcance de aprobación por proyecto del gestor
El sistema SHALL permitir que un gestor apruebe, rechace o apruebe-con-observación únicamente las líneas cuyos proyectos tienen `manager_id` igual al gestor. La acción opera sobre el bloque completo de un proyecto dentro de una semana (la "solicitud"), identificado por `proyecto_id` o por los `line_ids` de ese bloque.

#### Scenario: Gestor aprueba su propio proyecto
- **WHEN** el gestor del Proyecto A aprueba la solicitud de un seeker para el Proyecto A en la semana S20/26
- **THEN** todas las líneas de ese seeker para el Proyecto A en esa semana pasan a `APROBADO` y las líneas de otros proyectos quedan sin cambios

#### Scenario: Gestor no puede actuar sobre proyectos ajenos
- **WHEN** el gestor del Proyecto A intenta aprobar o rechazar líneas de un Proyecto B que no administra
- **THEN** el sistema rechaza la operación con un error de autorización (403)

#### Scenario: Admin puede actuar sobre cualquier proyecto
- **WHEN** un ADMIN aprueba o rechaza líneas de cualquier proyecto
- **THEN** la operación se permite sin la restricción de `manager_id`

#### Scenario: Observación solo sobre líneas pendientes
- **WHEN** un gestor aprueba-con-observación e intenta ajustar las horas de una línea que ya está `APROBADO` o `RECHAZADO`
- **THEN** el ajuste se restringe a las líneas `PENDIENTE` del proyecto y no modifica las ya resueltas

### Requirement: Bandeja de solicitudes del gestor
El sistema SHALL exponer al gestor las solicitudes pendientes filtrando por **líneas en estado `PENDIENTE` de sus proyectos**, y no por el estado agregado de la semana. Una solicitud SHALL corresponder a la combinación (seeker, semana, proyecto gestionado por el gestor).

#### Scenario: Solicitud sigue visible tras aprobar otro proyecto de la misma semana
- **WHEN** un seeker carga Proyecto A (gestor Ana) y Proyecto B (gestor Bruno) en la semana S20/26, y Ana ya aprobó el Proyecto A
- **THEN** el Proyecto B sigue apareciendo como solicitud pendiente en la bandeja de Bruno

#### Scenario: Cada proyecto es una solicitud independiente
- **WHEN** un seeker carga dos proyectos administrados por el mismo gestor en la misma semana
- **THEN** el gestor ve dos solicitudes separadas, una por proyecto

### Requirement: El seeker no edita lo cargado
El sistema SHALL impedir que un seeker edite las líneas ya cargadas. El endpoint de edición (`PUT /time-entries/:id`) y la pantalla de ajuste del seeker SHALL eliminarse.

#### Scenario: Edición deshabilitada
- **WHEN** un seeker intenta modificar las horas de una línea ya cargada
- **THEN** no existe un mecanismo de edición disponible para el seeker

### Requirement: Re-carga de un proyecto rechazado
El sistema SHALL permitir que un seeker vuelva a cargar las horas de un proyecto que le fue rechazado, para la misma semana, creando una nueva línea en estado `PENDIENTE`. La línea rechazada SHALL conservarse activa (`is_active = true`, `status = 'RECHAZADO'`) — NO es una baja lógica — y por lo tanto puede coexistir con la nueva línea `PENDIENTE` del mismo proyecto. El guard de duplicados SHALL operar sobre la combinación `(usuario, semana, proyecto)` para líneas no rechazadas, en lugar de `(usuario, semana)`.

#### Scenario: Re-carga permitida tras rechazo
- **WHEN** el Proyecto B de un seeker en la semana S20/26 está `RECHAZADO` y el seeker carga nuevamente el Proyecto B para esa semana
- **THEN** se crea una nueva línea `PENDIENTE` para el Proyecto B y la línea rechazada anterior se conserva

#### Scenario: Re-carga bloqueada si ya está pendiente o aprobado
- **WHEN** el Proyecto A de un seeker en la semana S20/26 está `PENDIENTE` o `APROBADO` y el seeker intenta cargar nuevamente el Proyecto A para esa semana
- **THEN** el sistema rechaza la carga con un error de validación

### Requirement: Auditoría de aprobaciones por línea
El sistema SHALL registrar cada acción de aprobación, rechazo u observación vinculada a la(s) línea(s) o proyecto afectados, además de la semana, de modo que sea posible saber qué gestor aprobó qué proyecto y cuándo.

#### Scenario: Registro vinculado al proyecto/línea
- **WHEN** un gestor aprueba o rechaza una solicitud de proyecto
- **THEN** se crea un registro de auditoría que identifica la(s) línea(s)/proyecto afectados, la acción, el comentario o razón, y el gestor que la realizó

### Requirement: Cómputo financiero de horas por línea aprobada
El sistema SHALL contabilizar en costos de personal únicamente las horas de líneas en estado `APROBADO` o `APROBADO_CON_OBSERVACION`, dejando de depender del estado agregado de la semana.

#### Scenario: Cuenta horas aprobadas con observación
- **WHEN** una línea está en estado `APROBADO_CON_OBSERVACION`
- **THEN** sus horas (normales + extra) se incluyen en el cómputo de costos de personal

#### Scenario: No cuenta horas pendientes o rechazadas
- **WHEN** una línea está en estado `PENDIENTE` o `RECHAZADO`
- **THEN** sus horas no se incluyen en el cómputo de costos de personal, aunque otras líneas de la misma semana estén aprobadas
