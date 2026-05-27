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

