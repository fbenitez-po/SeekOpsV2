## ADDED Requirements

### Requirement: Listado público de proyectos
El sistema SHALL exponer `GET /api/dashboard/project` como un endpoint **abierto** (sin token) que devuelve **todos** los proyectos como un **array plano JSON desnormalizado**, sin paginación, ordenado por fecha de creación descendente, replicando `GET /api/project/` de v1.

#### Scenario: Acceso sin autenticación
- **WHEN** un cliente hace `GET /api/dashboard/project` sin cabecera `Authorization`
- **THEN** el sistema responde `200 OK` (no `401`)

#### Scenario: Forma de array plano
- **WHEN** un cliente solicita el listado
- **THEN** el cuerpo es un array JSON de objetos, sin la forma `{ data, pagination }`

### Requirement: Contrato de proyectos desnormalizado con claves de v1
Cada elemento SHALL contener exactamente las claves del `.values(...)` de v1, **preservando los paths con doble guion bajo** (`client__business_name`, `manager__document_number`, `layer_productivity__name`, etc.). La traducción desde el schema de v2 SHALL ocurrir en el `mapper`.

#### Scenario: Claves desnormalizadas y campos directos
- **WHEN** un cliente recibe un elemento del listado
- **THEN** el objeto contiene `code`, `name`, `created_at`, `start_date`, `end_date`, las claves `client__*`, `manager__*` y `layer_productivity__name` con los datos correspondientes de v2

#### Scenario: Traducción de fechas reales
- **WHEN** se serializa un proyecto
- **THEN** `real_start_date` = `actual_start_date` y `real_end_date` = `actual_end_date`

#### Scenario: Campos sin equivalente en v2 expuestos como null
- **WHEN** se serializa un proyecto
- **THEN** las claves `status`, `tier`, `evaluation_internal`, `evaluation_external`, `image`, `flag_poll`, `comments_date` y `category__iframe_poll` están presentes con valor `null`

#### Scenario: Claves de categoría presentes
- **WHEN** se serializa un proyecto
- **THEN** las claves `category__name` y `category_extension__name` están presentes con valor `null` mientras la ambigüedad de mapeo v1↔v2 esté diferida (ver Q2/Q3 del design); su resolución posterior solo modifica el `mapper`
