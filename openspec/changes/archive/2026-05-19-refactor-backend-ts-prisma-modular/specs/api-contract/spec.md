## ADDED Requirements

### Requirement: Claves JSON del contrato preservadas en español

El sistema SHALL responder con exactamente las mismas claves JSON (en español) que el backend actual para todo request y response, independientemente de que el código interno y la base de datos usen identificadores en inglés. La traducción inglés ⇄ español SHALL ocurrir en la capa `mapper` de cada módulo.

#### Scenario: GET de un recurso devuelve claves en español

- **WHEN** un cliente autenticado hace `GET /clients/:id`
- **THEN** el cuerpo de la respuesta contiene las claves `razon_social`, `razon_comercial`, `ruc`, `nombre_contacto`, `email_contacto`, `telefono`, `direccion`, `activo`, `creado_en` (mismas que antes del refactor)
- **AND** no aparece ninguna clave en inglés (`legal_name`, `is_active`, etc.)

#### Scenario: POST acepta el mismo cuerpo en español

- **WHEN** un cliente envía `POST /clients` con el cuerpo en español que usa hoy (`razon_social`, `ruc`, `segmentacion_id`, ...)
- **THEN** el recurso se crea correctamente y la respuesta conserva las claves en español
- **AND** el código de estado es `201`

#### Scenario: Listado conserva el shape de paginación

- **WHEN** un cliente hace `GET /clients`
- **THEN** la respuesta tiene la forma `{ data: [...], pagination: { page, limit, total, pages } }` idéntica a la previa al refactor

### Requirement: Status codes y formato de error preservados

El sistema SHALL devolver los mismos códigos de estado HTTP y el mismo formato de cuerpo de error `{ "error": "<mensaje>" }` que el backend actual, incluyendo el mapeo de errores de PostgreSQL.

#### Scenario: Recurso inexistente

- **WHEN** se solicita un recurso que no existe (p. ej. `GET /clients/:id` con id inválido)
- **THEN** el código de estado es `404`
- **AND** el cuerpo es `{ "error": "Cliente no encontrado" }`

#### Scenario: Violación de unicidad en la base de datos

- **WHEN** una operación de escritura provoca un error PostgreSQL `23505` (valor duplicado)
- **THEN** el código de estado es `409`
- **AND** el cuerpo es `{ "error": "El registro ya existe (valor duplicado)" }`

#### Scenario: Referencia inválida (FK)

- **WHEN** una operación provoca un error PostgreSQL `23503`
- **THEN** el código de estado es `400`
- **AND** el cuerpo es `{ "error": "Referencia inválida: el recurso relacionado no existe" }`

#### Scenario: Error de validación

- **WHEN** se envía un cuerpo que falla la validación
- **THEN** el código de estado es `400`
- **AND** el cuerpo es `{ "error": "<primer mensaje de validación>" }` con el mismo texto en español que hoy

### Requirement: Contrato de autenticación y autorización preservado

El sistema SHALL mantener sin cambios el contrato de autenticación: el payload del JWT (`roles`, `email`), la respuesta de login (`access_token`, `refresh_token`) y los códigos de estado de autorización.

#### Scenario: Login devuelve el mismo shape

- **WHEN** un usuario válido hace `POST /auth/login`
- **THEN** la respuesta contiene `access_token` y `refresh_token` con los mismos nombres de clave que hoy

#### Scenario: Token ausente o inválido

- **WHEN** se accede a un endpoint protegido sin token o con token inválido
- **THEN** el código de estado es `401` con cuerpo `{ "error": "Token requerido" }` o `{ "error": "Token inválido o expirado" }` según corresponda

#### Scenario: Rol insuficiente

- **WHEN** un usuario sin rol `ADMIN` accede a un endpoint solo-admin
- **THEN** el código de estado es `403` con el mismo mensaje en español que hoy

### Requirement: Paths anglicizados con cuerpo y status idénticos

El sistema SHALL exponer los endpoints de Finanzas/Comercial y los verbos de acción bajo nombres en inglés, devolviendo exactamente el mismo cuerpo y código de estado que devolvían bajo el nombre en español. Los paths que ya estaban en inglés SHALL permanecer sin cambios.

#### Scenario: Recurso de finanzas bajo path en inglés

- **WHEN** un cliente hace `GET /revenues` (antes `/ingresos`)
- **THEN** la respuesta tiene el mismo cuerpo y status que tenía `GET /ingresos` antes del refactor
- **AND** lo mismo aplica para `/admin-expenses` (ex `/gastos-admin`), `/sales-costs` (ex `/costos-venta`), `/personnel-costs` (ex `/costos-por-persona`), `/periods` (ex `/periodos`), `/commercial` (ex `/comercial`)

#### Scenario: Verbo de acción bajo nombre en inglés

- **WHEN** un cliente hace `POST /time-entries/:id/approve` (antes `/aprobar`)
- **THEN** el efecto y la respuesta son idénticos a los de `/aprobar` antes del refactor
- **AND** lo mismo aplica para `/observe` (ex `/observar`), `/reject` (ex `/rechazar`) y `/projections/alerts` (ex `/alertas`)

#### Scenario: Paths ya en inglés sin cambios

- **WHEN** un cliente hace `GET /clients`, `GET /users`, `GET /projects`, `GET /time-entries`, `GET /projections` o `GET /config/*`
- **THEN** el path responde igual que antes del refactor (no fue renombrado)
