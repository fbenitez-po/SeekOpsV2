# dashboard-api Specification

## Purpose
TBD - created by archiving change migrate-dashboard-seekers. Update Purpose after archive.
## Requirements
### Requirement: Listado público de seekers
El sistema SHALL exponer `GET /api/dashboard/seekers` como un endpoint **abierto** (sin requerir token de autenticación) que devuelve **todos** los usuarios del sistema como un **array plano JSON**, sin paginación ni envoltorio. Esto replica el comportamiento de `GET /seekers/` de v1 (`User.objects.all()` con `permission_classes = []` y `pagination_class = None`).

#### Scenario: Acceso sin autenticación
- **WHEN** un cliente hace `GET /api/dashboard/seekers` sin cabecera `Authorization`
- **THEN** el sistema responde `200 OK` con el listado de seekers (no responde `401`)

#### Scenario: Forma de array plano
- **WHEN** un cliente solicita el listado de seekers
- **THEN** el cuerpo de la respuesta es un array JSON de objetos (`[ {...}, {...} ]`)
- **AND** NO tiene la forma paginada `{ data: [...], pagination: {...} }` que usa el resto de la API v2

#### Scenario: Devuelve todos los usuarios
- **WHEN** existen usuarios activos e inactivos en el sistema
- **THEN** el listado incluye a todos sin filtrar por `is_active` (fidelidad con `User.objects.all()` de v1)

### Requirement: Contrato de respuesta heredado de v1 (claves en inglés)
Cada elemento del listado de seekers SHALL contener exactamente las claves del `SeekerSerializer` de v1, en **inglés**: `email`, `first_name`, `last_name`, `job`, `cellphone`, `document_number`, `team`, `is_active`. Esta es una **excepción documentada** a la regla del spec `api-contract` (claves en español): el contrato preserva la compatibilidad byte-a-byte con el consumidor BI de v1. La traducción desde el schema interno de v2 SHALL ocurrir en la capa `mapper`.

#### Scenario: Claves exactas del contrato v1
- **WHEN** un cliente recibe un elemento del listado de seekers
- **THEN** el objeto contiene las claves `email`, `first_name`, `last_name`, `job`, `cellphone`, `document_number`, `team`, `is_active`
- **AND** no aparecen las claves internas de v2 (`position`, `mobile_phone`, `teams`, ni las claves en español como `nombres`/`apellidos`)

#### Scenario: Traducción de campos renombrados
- **WHEN** un usuario tiene `position = "Consultora"` y `mobile_phone = "+57300..."` en el schema de v2
- **THEN** el elemento del listado expone `job = "Consultora"` y `cellphone = "+57300..."`

#### Scenario: Equipo como string
- **WHEN** un usuario pertenece a un equipo con `name = "Equipo Norte"`
- **THEN** el elemento expone `team = "Equipo Norte"` (string)

#### Scenario: Usuario sin equipo
- **WHEN** un usuario no tiene equipo asignado (`team_id` nulo)
- **THEN** el elemento expone `team = null`

### Requirement: Aislamiento del módulo de integración
El recurso `seekers` SHALL implementarse en un módulo paraguas `dashboard` independiente, con su propia capa de acceso a datos read-only, sin reutilizar el `service` ni el `mapper` del módulo `users`. El acceso a datos SHALL limitarse a operaciones de lectura sobre tablas existentes (`users`, `teams`), sin modificar el schema.

#### Scenario: Solo lectura
- **WHEN** se invoca cualquier ruta de `dashboard/seekers`
- **THEN** la operación es de lectura y no crea, actualiza ni elimina registros

#### Scenario: Sin impacto en otros módulos
- **WHEN** se implementa el recurso `seekers`
- **THEN** los módulos `users`, `projects`, `commercial` y `clients` no se modifican

### Requirement: Listado público de clientes
El sistema SHALL exponer `GET /api/dashboard/clients` como un endpoint **abierto** (sin token) que devuelve **todos** los clientes como un **array plano JSON**, sin paginación ni envoltorio, replicando `GET /api/client/` de v1.

#### Scenario: Acceso sin autenticación
- **WHEN** un cliente hace `GET /api/dashboard/clients` sin cabecera `Authorization`
- **THEN** el sistema responde `200 OK` con el listado (no `401`)

#### Scenario: Forma de array plano
- **WHEN** un cliente solicita el listado de clientes
- **THEN** el cuerpo es un array JSON de objetos, sin la forma `{ data, pagination }`

### Requirement: Contrato de clientes heredado de v1
Cada elemento SHALL contener exactamente las claves del `ClientModelSerializer` de v1: `id`, `business_reason`, `business_name`, `business_number`, `fiscal_address`, `legal_address`, `segmentation`, `sector`. La traducción desde el schema de v2 SHALL ocurrir en el `mapper`.

#### Scenario: Claves y traducción de campos
- **WHEN** un cliente recibe un elemento del listado
- **THEN** el objeto expone `business_reason` (= `legal_name`), `business_name` (= `trade_name`), `business_number` (= `ruc`)
- **AND** no aparecen claves internas de v2 (`legal_name`, `trade_name`, `ruc`) ni claves en español

#### Scenario: Campos sin equivalente exacto en v2
- **WHEN** un cliente recibe un elemento del listado
- **THEN** las claves `fiscal_address` y `legal_address` están presentes, cubiertas por el único `address` de v2 según el reparto definido (una de ellas puede ser `null`)
- **AND** `segmentation` y `sector` exponen el identificador de la relación (uuid en v2)

### Requirement: Listado público de registros comerciales
El sistema SHALL exponer `GET /api/dashboard/commercial` como un endpoint **abierto** (sin token) que devuelve **todos** los registros comerciales como un **array plano JSON desnormalizado**, sin paginación, ordenado por fecha de creación descendente, replicando `GET /api/commercial/` de v1.

#### Scenario: Acceso sin autenticación
- **WHEN** un cliente hace `GET /api/dashboard/commercial` sin cabecera `Authorization`
- **THEN** el sistema responde `200 OK` (no `401`)

#### Scenario: Forma de array plano
- **WHEN** un cliente solicita el listado
- **THEN** el cuerpo es un array JSON de objetos, sin la forma `{ data, pagination }`

### Requirement: Contrato comercial desnormalizado con claves de v1
Cada elemento SHALL contener exactamente las claves del `.values(...)` de v1, **preservando los paths con doble guion bajo** (`project__client__business_name`, `responsible__first_name`, etc.). La traducción desde el schema de v2 SHALL ocurrir en el `mapper`.

#### Scenario: Claves desnormalizadas preservadas
- **WHEN** un cliente recibe un elemento del listado
- **THEN** el objeto contiene las claves con `__` idénticas a v1 (incluyendo `project__client__sector__name`, `project__manager__first_name`, `responsible__document_number`)

#### Scenario: Traducción de campos renombrados
- **WHEN** se serializa un registro comercial
- **THEN** `date` = `record_date`, `coin` = `currency`, `status` = `has_contract`, `billing` = `is_billed`
- **AND** `responsible__*` proviene del `owner` del registro

#### Scenario: Campos sin equivalente en v2
- **WHEN** se serializa un registro comercial
- **THEN** las claves `type`, `division__name` y `duration` están presentes con valor `null`

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

