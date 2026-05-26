## MODIFIED Requirements

### Requirement: Estado de aprobación por línea
El sistema SHALL almacenar el estado de revisión de cada línea de horas **exclusivamente en `time_entry_approvals`**, con valores `PENDIENTE`, `APROBADO`, `APROBADO_CON_OBSERVACION` o `RECHAZADO`. Por cada línea creada en una carga (`time_entry_lines`) el sistema SHALL generar **una fila paralela en `time_entry_approvals` en estado `PENDIENTE`**, vinculada por `time_entry_line_id`. Las tablas `time_entries` y `time_entry_lines` NO SHALL tener columna `status`.

#### Scenario: Líneas nacen con approval pendiente
- **WHEN** un usuario (seeker o gestor) carga horas de una semana con líneas para uno o más proyectos
- **THEN** por cada línea creada se crea una fila en `time_entry_approvals` en estado `PENDIENTE` vinculada a esa línea, independientemente de los roles del usuario que carga

#### Scenario: No hay auto-aprobación por rol
- **WHEN** un usuario con rol GESTOR carga sus propias horas
- **THEN** la approval de cada línea queda `PENDIENTE` y debe ser resuelta explícitamente (no se auto-aprueba)

#### Scenario: El estado no vive en líneas ni semana
- **WHEN** se consulta el estado de revisión de una línea
- **THEN** el valor proviene de su fila en `time_entry_approvals`, y ni `time_entries` ni `time_entry_lines` exponen una columna `status`

### Requirement: Alcance de aprobación por proyecto del gestor
El sistema SHALL permitir que un gestor apruebe, rechace o apruebe-con-observación únicamente las líneas cuyos proyectos tienen `manager_id` igual al gestor. La acción SHALL identificar la línea afectada por su `linea_id` y operar **mutando la fila `time_entry_approvals` de esa línea** desde `PENDIENTE` al estado resultante. Al aprobar-con-observación, las horas indicadas por el gestor SHALL guardarse **solo** en `suggested_hours`/`suggested_extra_hours` de la approval y NO SHALL modificar `time_entry_lines`.

#### Scenario: Gestor aprueba una línea de su proyecto
- **WHEN** el gestor del Proyecto A aprueba una línea de un seeker para el Proyecto A en la semana S20/26
- **THEN** la approval de esa línea pasa a `APROBADO` (con `reviewed_by`/`reviewed_at`) y las approvals de otras líneas quedan sin cambios

#### Scenario: Gestor no puede actuar sobre proyectos ajenos
- **WHEN** el gestor del Proyecto A intenta actuar sobre una línea de un Proyecto B que no administra
- **THEN** el sistema rechaza la operación con un error de autorización (403)

#### Scenario: Admin puede actuar sobre cualquier proyecto
- **WHEN** un ADMIN aprueba o rechaza una línea de cualquier proyecto
- **THEN** la operación se permite sin la restricción de `manager_id`

#### Scenario: La observación no modifica las horas cargadas
- **WHEN** un gestor aprueba-con-observación una línea cargada con 40h indicando 32h
- **THEN** `time_entry_lines` conserva intactas las 40h (invariante de almacenamiento), la approval pasa a `APROBADO_CON_OBSERVACION` con `suggested_hours = 32`, y el seeker ve 32h (horas efectivas) con estado `APROBADO_CON_OBSERVACION`

#### Scenario: Solo se actúa sobre approvals pendientes
- **WHEN** un gestor intenta actuar sobre una línea cuya approval ya está `APROBADO`, `RECHAZADO` o `APROBADO_CON_OBSERVACION`
- **THEN** la operación se rechaza y no altera la approval ya resuelta

### Requirement: Bandeja de solicitudes del gestor
El sistema SHALL exponer al gestor las solicitudes pendientes filtrando por **approvals en estado `PENDIENTE` de líneas cuyos proyectos administra** (`manager_id`), y no por un estado agregado de la semana. Una solicitud SHALL corresponder a la combinación (seeker, semana, proyecto + categoría = línea).

#### Scenario: Solicitud sigue visible tras aprobar otra línea de la misma semana
- **WHEN** un seeker carga Proyecto A (gestor Ana) y Proyecto B (gestor Bruno) en la semana S20/26, y Ana ya aprobó la línea del Proyecto A
- **THEN** la línea del Proyecto B sigue apareciendo como solicitud pendiente en la bandeja de Bruno (su approval sigue `PENDIENTE`)

#### Scenario: Cada línea es una solicitud independiente
- **WHEN** un seeker carga, en la misma semana, un proyecto de área con dos categorías administradas por el mismo gestor
- **THEN** el gestor ve dos solicitudes separadas, una por línea (proyecto + categoría)

### Requirement: Re-carga de un proyecto rechazado
El sistema SHALL permitir que un seeker vuelva a cargar las horas de un proyecto cuya approval quedó en `RECHAZADO`, para la misma semana, creando **una nueva línea en `time_entry_lines` y una nueva approval en estado `PENDIENTE`**. La línea rechazada y su approval `RECHAZADO` SHALL conservarse (histórico) y pueden coexistir con la nueva línea pendiente del mismo proyecto/categoría. El guard de duplicados SHALL bloquear la carga cuando exista una línea activa del mismo `(usuario, semana, proyecto, categoría)` cuya approval NO esté `RECHAZADO`.

#### Scenario: Re-carga permitida tras rechazo
- **WHEN** la línea del Proyecto B de un seeker en la semana S20/26 tiene su approval en `RECHAZADO` y el seeker carga nuevamente el Proyecto B para esa semana
- **THEN** se crea una nueva línea con su approval `PENDIENTE`, y la línea/approval rechazadas anteriores se conservan

#### Scenario: Re-carga bloqueada si ya está pendiente o aprobado
- **WHEN** la línea del Proyecto A de un seeker en la semana S20/26 tiene su approval en `PENDIENTE` o `APROBADO` y el seeker intenta cargar nuevamente esa combinación proyecto/categoría
- **THEN** el sistema rechaza la carga con un error de validación

### Requirement: Auditoría de aprobaciones por línea
El sistema SHALL registrar cada acción de revisión en la fila `time_entry_approvals` de la línea afectada, que es a la vez **fuente de verdad del estado** y registro de auditoría. La fila SHALL guardar `created_by`/`created_at` (generación del `PENDIENTE` en la carga) y `reviewed_by`/`reviewed_at` (gestor que resolvió y cuándo), junto con el comentario u observación y la razón de rechazo según corresponda.

#### Scenario: Registro vinculado a la línea con autor y fecha de revisión
- **WHEN** un gestor aprueba, observa o rechaza la línea de un proyecto
- **THEN** la approval de esa línea queda con el estado resultante, `reviewed_by` y `reviewed_at` del gestor, y el comentario o razón asociados, permitiendo saber qué gestor resolvió qué línea y cuándo

### Requirement: Cómputo de horas efectivas por línea aprobada
El sistema SHALL definir las **horas efectivas** de una línea según el estado de su approval: para `APROBADO_CON_OBSERVACION`, las horas efectivas SHALL ser `suggested_hours`/`suggested_extra_hours` de la approval; para `APROBADO`, las horas efectivas SHALL ser las cargadas en `time_entry_lines`; para `PENDIENTE` o `RECHAZADO`, la línea NO SHALL aportar horas. Las horas efectivas SHALL usarse en costos de personal, totales y reportes, y SHALL ser las horas que el seeker visualiza para una línea resuelta, junto con el estado de su approval.

#### Scenario: El seeker ve horas efectivas y estado de la approval
- **WHEN** el seeker consulta una línea `APROBADO` (40h cargadas) y otra `APROBADO_CON_OBSERVACION` (40h cargadas, 32h sugeridas)
- **THEN** ve 40h con estado `APROBADO` en la primera y 32h con estado `APROBADO_CON_OBSERVACION` en la segunda

#### Scenario: Observada cuenta con las horas sugeridas
- **WHEN** una línea está `APROBADO_CON_OBSERVACION` con 40h cargadas y 32h sugeridas
- **THEN** el cómputo de costos, totales y reportes usa 32h para esa línea

#### Scenario: Aprobada cuenta con las horas cargadas
- **WHEN** una línea está `APROBADO` con 40h cargadas y sin sugerencia
- **THEN** el cómputo usa 40h para esa línea

#### Scenario: Pendiente o rechazada no cuenta
- **WHEN** una línea está `PENDIENTE` o `RECHAZADO`
- **THEN** sus horas no se incluyen en costos, totales ni reportes, aunque otras líneas de la misma semana estén aprobadas

## ADDED Requirements

### Requirement: Inmutabilidad de las horas cargadas
El sistema SHALL tratar `time_entry_lines` como un registro inmutable de lo cargado por el seeker. Tras la creación de una línea, ninguna acción de revisión del gestor SHALL modificar sus `hours`, `extra_hours`, `comment`, `project_id` ni `income_category_id`.

#### Scenario: Ninguna acción de revisión altera la línea
- **WHEN** un gestor aprueba, observa o rechaza una línea
- **THEN** los campos de horas y categoría de `time_entry_lines` permanecen idénticos a lo cargado por el seeker

### Requirement: La API no expone estado de semana
El sistema SHALL eliminar el estado a nivel de semana de la API. La respuesta de listado y detalle de horas NO SHALL incluir un campo `estado` a nivel de entrada/semana; SHALL exponer el estado por línea (derivado de su approval) y el detalle de approvals.

#### Scenario: Respuesta sin estado de semana
- **WHEN** un cliente consulta `GET /time-entries` o el detalle de una entrada
- **THEN** la respuesta no contiene `estado` de semana, e incluye `lineas[].estado` y `aprobaciones[]`

#### Scenario: Filtro por estado opera sobre approvals
- **WHEN** un cliente filtra el listado con `?estado=PENDIENTE`
- **THEN** se devuelven las entradas que tienen al menos una línea cuya approval está en ese estado (acotado a los proyectos del gestor cuando aplica)

## REMOVED Requirements

### Requirement: Estado de la semana derivado
**Reason**: Se elimina el concepto de estado a nivel de semana; solo interesa el estado por proyecto + categoría (línea). La columna `time_entries.status` y su rollup desaparecen.
**Migration**: Los consumidores que mostraban el badge de semana pasan a mostrar el estado por proyecto/línea (patrón desplegable bloque→proyectos). El filtro `?estado=` opera sobre approvals de líneas en vez del estado agregado.
