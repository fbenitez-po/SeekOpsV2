## ADDED Requirements

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
