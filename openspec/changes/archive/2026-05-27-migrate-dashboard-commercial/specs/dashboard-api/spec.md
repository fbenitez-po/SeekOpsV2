## ADDED Requirements

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
