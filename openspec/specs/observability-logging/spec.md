# observability-logging Specification

## Purpose
Logging estructurado del backend (`apps/api`): logger central basado en pino, log por petición con correlación request-id, niveles configurables por ambiente, redacción de secretos, reglas de formato por entorno, instrumentación de eventos de negocio/seguridad en la capa `service`, e integración con el manejo de errores sin alterar el contrato de la API. Refleja el estado del código tras el change `add-structured-logging` (2026-05-28).

## Requirements

### Requirement: Logger central estructurado

El backend SHALL exponer un logger central basado en pino que emita logs estructurados (objetos con nivel, timestamp y mensaje) y que sea el único punto de configuración de logging de la aplicación.

#### Scenario: El logger emite estructura, no texto plano
- **WHEN** cualquier capa de la aplicación registra un evento con el logger
- **THEN** la línea emitida incluye al menos `level`, `time` y `msg` como campos estructurados

#### Scenario: Reemplazo de console.*
- **WHEN** se revisa el código de `apps/api/src` tras el cambio
- **THEN** no quedan llamadas a `console.log`/`console.error`/`console.warn`/`console.info`/`console.debug` en el código de aplicación
- **AND** los puntos previos (arranque del servidor, env inválido, email en dev, error 500) usan el logger central

### Requirement: Niveles de log configurables por ambiente

El logger SHALL respetar un nivel mínimo configurable mediante la variable de entorno `LOG_LEVEL`, validada en el schema de configuración, con un valor por defecto razonable.

#### Scenario: LOG_LEVEL controla la verbosidad
- **WHEN** `LOG_LEVEL=info` y la aplicación intenta emitir un log de nivel `debug`
- **THEN** ese log no se emite

#### Scenario: Valor por defecto
- **WHEN** no se define `LOG_LEVEL` en el entorno
- **THEN** la aplicación arranca con un nivel por defecto sin fallar la validación de env

#### Scenario: Valor inválido detenido por validación
- **WHEN** `LOG_LEVEL` tiene un valor fuera del conjunto permitido
- **THEN** la validación de env falla y la aplicación no arranca

### Requirement: Log por petición con correlación

El backend SHALL registrar automáticamente cada petición HTTP mediante pino-http, asignando un identificador de correlación (request-id) único por petición que aparezca en todas las líneas de log de esa petición.

#### Scenario: Log de petición completada
- **WHEN** una petición HTTP se completa
- **THEN** se emite una línea de log con método, ruta, código de estado y duración de la petición

#### Scenario: Correlación por request-id
- **WHEN** una petición genera múltiples líneas de log (incluido un error)
- **THEN** todas esas líneas comparten el mismo request-id

### Requirement: Redacción de datos sensibles

El logger SHALL redactar datos sensibles para que nunca se escriban en los logs: contraseñas, tokens (access/refresh) y el header `Authorization`.

#### Scenario: Contraseña redactada
- **WHEN** un objeto que contiene un campo `password` se incluye en un log
- **THEN** el valor del `password` no aparece en la salida (se muestra redactado u omitido)

#### Scenario: Authorization y tokens redactados
- **WHEN** se loguea una petición que incluye el header `Authorization` o un token en el cuerpo
- **THEN** ese valor no aparece en la salida en texto claro

### Requirement: Formato de salida por ambiente

El logging SHALL adaptar su formato al ambiente: salida legible (pino-pretty) en desarrollo, JSON a stdout en producción, y silencio en test.

#### Scenario: JSON en producción
- **WHEN** `NODE_ENV=production`
- **THEN** los logs se emiten como JSON a stdout (sin formato pretty)

#### Scenario: Legible en desarrollo
- **WHEN** `NODE_ENV=development`
- **THEN** los logs se emiten en formato legible para humanos

#### Scenario: Silencio en test
- **WHEN** `NODE_ENV=test`
- **THEN** la ejecución de la suite de tests no produce salida de logs de la aplicación

### Requirement: Logging de eventos de negocio y seguridad

El backend SHALL registrar eventos de negocio y de seguridad desde la capa `service`, siguiendo una política de niveles consistente. SHALL loguearse las mutaciones y los eventos de seguridad; las lecturas/listados NO se loguean manualmente (los cubre el log por petición). Cada log de negocio SHALL incluir el actor (email) y el identificador del recurso afectado, y NUNCA el payload completo ni datos sensibles.

#### Scenario: Mutación de negocio logueada con actor e id
- **WHEN** se crea, actualiza o cambia el estado (toggle) de un recurso (usuario, cliente, proyecto, registro comercial, período, etc.)
- **THEN** se emite un log nivel `info` con un mensaje estable, el email del actor y el id del recurso afectado

#### Scenario: Evento del flujo de aprobación de horas
- **WHEN** un seeker carga horas o un gestor aprueba/observa/rechaza una línea
- **THEN** se emite un log nivel `info` que identifica el evento, el actor y la línea afectada

#### Scenario: Evento de seguridad fallido
- **WHEN** un intento de login falla o se presenta un token inválido/expirado
- **THEN** se emite un log nivel `warn` que describe el evento sin exponer credenciales

#### Scenario: Lecturas no generan log manual
- **WHEN** se atiende una petición de listado o consulta por id
- **THEN** no se emite ningún log de negocio adicional desde el service (solo el log por petición de pino-http)

#### Scenario: Mensaje estable sin datos interpolados
- **WHEN** se emite cualquier log de negocio
- **THEN** el mensaje (`msg`) es estable (sin datos variables interpolados) y el detalle viaja en campos estructurados

### Requirement: Integración con el manejo de errores

El logger SHALL integrarse en el `errorHandler` central de forma que los errores se registren con su contexto, sin modificar el contrato de respuestas de error existente.

#### Scenario: Error 500 logueado con contexto
- **WHEN** una petición produce un error no controlado (status >= 500)
- **THEN** el error se registra vía el logger con nivel `error` e incluye el request-id correlacionado

#### Scenario: Contrato de error intacto
- **WHEN** se produce cualquier `AppError` (400/401/403/404/409) o un error 500
- **THEN** el cuerpo y el código de estado de la respuesta HTTP son los mismos que antes del cambio
