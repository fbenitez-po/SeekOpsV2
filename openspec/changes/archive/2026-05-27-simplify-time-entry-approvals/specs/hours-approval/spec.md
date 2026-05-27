## MODIFIED Requirements

### Requirement: Auditoría de aprobaciones por línea
El sistema SHALL registrar cada acción de aprobación, rechazo u observación vinculada a la(s) línea(s) o proyecto afectados, además de la semana, de modo que sea posible saber qué gestor aprobó qué proyecto y cuándo. El campo `comment` SHALL ser el portador unificado del texto libre del gestor, tanto para observaciones (`APROBADO_CON_OBSERVACION`) como para motivos de rechazo (`RECHAZADO`). El campo dedicado `rejection_reason` SHALL eliminarse.

#### Scenario: Registro vinculado al proyecto/línea
- **WHEN** un gestor aprueba o rechaza una solicitud de proyecto
- **THEN** se crea un registro de auditoría que identifica la(s) línea(s)/proyecto afectados, la acción, el comentario o razón de rechazo en `comment`, y el gestor que la realizó

#### Scenario: Motivo de rechazo en comment
- **WHEN** un gestor rechaza una línea y proporciona una razón de rechazo
- **THEN** la razón se almacena en el campo `comment` del registro de aprobación, y el estado queda `RECHAZADO`

## REMOVED Requirements

### Requirement: Campo can_resubmit en rechazo
**Reason**: El permiso de re-envío está determinado implícitamente por el estado `RECHAZADO` de la línea. No se necesita un campo explícito — `findExistingLineForProject` ya permite re-cargar cualquier línea en estado `RECHAZADO`.
**Migration**: El body del endpoint de rechazo ya no acepta el campo `permitir_reenvio`. Los clientes que lo envíen DEBEN omitirlo. La lógica de re-envío no cambia.
