# Epic 01 — Seeker: Carga y Seguimiento de Horas

---

## US-001: Registrar horas semanales en un proyecto

### Historia de usuario

Como Seeker, quiero registrar mis horas trabajadas en un proyecto para una semana específica, para mantener un registro preciso de mi tiempo.

### Criterios de aceptación

**Selector de Semana:**
- **Given** estoy en formulario de carga **When** veo selector **Then** tengo botones [← semana →] con el rango de fechas "Lun X al Dom Y mes año" (sin código de semana)
- **Given** cambio de semana **When** presiono [← ó →] **Then** actualiza semana y lista de proyectos disponibles
- **Given** es mi primera carga **When** ingreso al formulario **Then** pre-selecciona semana actual (lunes a domingo de la semana en curso)

**Tabla de Proyectos Dinámicos:**
- **Given** estoy rellenando horas **When** veo tabla de proyectos **Then** tengo filas con campos: Proyecto* | Categoría | Horas* | Horas extra | Comentario
- **Given** selecciono un Proyecto **When** veo el formulario **Then** se habilita resto de campos y valida que no esté repetido
- **Given** selecciono Proyecto = "Area" **When** completo formulario **Then** "Categoría ingreso" se habilita; sino permanece deshabilitado/gris
- **Given** intento repetir un proyecto **When** lo selecciono en otra fila **Then** muestro error: "Este proyecto ya está en la carga actual"
- **Given** ingreso Horas **When** el valor es > 24 ó < 0 **Then** muestro error: "Máximo 24 horas"
- **Given** ingreso Horas extra **When** el valor es > 8 ó < 0 **Then** muestro error: "Máximo 8 horas extras"
- **Given** escribo Comentario **When** supero 500 caracteres **Then** valido límite (sin romper formulario)
- **Given** completo una fila **When** hago clic [+ Agregar proyecto] **Then** agrega nueva fila, dropdown excluye proyectos ya usados
- **Given** tengo múltiples filas **When** una tiene error **Then** muestro error en esa fila; otras no se afectan
- **Given** completo toda la carga **When** hago clic [Cargar] **Then** POST /time-entries → Confirmación

**Validación General:**
- **Given** intento cargar sin completar campos obligatorios **When** presiono [Cargar] **Then** muestro errores en rojo por campo
- **Given** he guardado horas **When** las visualizo en home **Then** aparecen con estado "Pendiente" y fecha de carga
- **Given** cargas exitosa **When** presiono [Cargar] **Then** redirige a S-01-CONFIRMACION-CARGA

**Semanas Retroactivas:**
- **Given** quiero cargar horas de semana anterior **When** uso [← →] **Then** puedo ir a cualquier semana (sin límite máximo)
- **Given** cargo horas muy antiguas **When** las guardo **Then** también se registran con fecha de carga actual (auditoría)

### Supuestos y riesgos

- Se asume que los proyectos están previamente asignados al seeker por el admin
- Los proyectos mostrados en el formulario son solo aquellos asignados al seeker

### Estado

✅ Lista para desarrollo

---

## US-004: Ver alerta de semanas sin carga al ingresar

### Historia de usuario

Como Seeker, quiero ver al ingresar al home cuáles semanas no he cargado desde mi fecha de ingreso a la compañía, para poder identificar rápidamente qué semanas me falta completar.

### Criterios de aceptación

**Visualización de la alerta:**
- **Given** ingreso al home **When** tengo semanas sin ninguna carga registrada desde mi `fecha_ingreso` hasta hoy **Then** veo una alerta ámbar en la parte superior de la página, antes de cualquier otro contenido
- **Given** veo la alerta **When** la reviso **Then** muestra el total de semanas faltantes y el listado de cada una con su rango de fechas legible (ej: "Lun 14 al Dom 20 abr 2026")
- **Given** veo la alerta **When** hay muchas semanas **Then** el listado es scrolleable (máximo altura visible antes de scroll)
- **Given** veo la alerta **When** hago clic en [Cargar horas] dentro de la alerta **Then** me redirige al formulario de carga

**Condición de la alerta:**
- **Given** una semana tiene al menos una carga registrada (en cualquier estado) **When** se evalúa **Then** esa semana NO aparece en la alerta
- **Given** cargo horas de una semana que estaba en la alerta **When** vuelvo al home **Then** esa semana ya no aparece en el listado
- **Given** todas mis semanas están cubiertas **When** ingreso al home **Then** la alerta NO se muestra

### Supuestos y riesgos

- La semana se considera "cubierta" con al menos una carga en cualquier estado (incluyendo RECHAZADO)
- La semana actual (en curso) también se incluye en la evaluación
- La lógica de codificación de semanas usa el mismo algoritmo que el formulario de carga para garantizar consistencia

### Estado

✅ Implementada

---

## US-002: Visualizar historial de horas cargadas

### Historia de usuario

Como Seeker, quiero ver todas mis horas registradas con el estado por proyecto, para hacer seguimiento de lo que he cargado.

### Criterios de aceptación

- **Given** estoy en el home **When** hago clic en "Mis horas" **Then** veo una lista de semanas con: semana, proyectos (badges de color con su estado), horas totales (no hay un estado único de semana)

- **Given** hago clic en una fila de semana **When** se expande **Then** veo una sub-fila por proyecto con su estado individual (PENDIENTE/APROBADO/APROBADO_CON_OBSERVACION/RECHAZADO)

- **Given** veo el historial **When** aplico filtro por "Proyecto" **Then** la lista se filtra a semanas que contienen ese proyecto

- **Given** veo el historial **When** aplico filtro por "Estado" **Then** la lista se filtra a semanas con al menos un proyecto en ese estado

- **Given** expando una semana y veo un proyecto con estado "Rechazado" **When** hago clic en "Re-cargar" **Then** me redirige al formulario de carga pre-seleccionando esa semana y ese proyecto

### Supuestos y riesgos

- El estado por proyecto/línea proviene de `time_entry_approvals` (una fila por línea, `time_entry_line_id` UNIQUE). No existe un estado único de semana; cada proyecto muestra su propio estado.
- Se asume que hay suficientes datos para justificar paginación (opción: mostrar últimas 20, cargar más)

### Estado

✅ Lista para desarrollo

---

## US-003: Re-cargar un proyecto rechazado

### Historia de usuario

Como Seeker, quiero poder volver a cargar horas en un proyecto que me fue rechazado para esa semana, sin necesidad de recargar toda la semana.

### Criterios de aceptación

- **Given** tengo un proyecto con estado RECHAZADO en una semana **When** hago clic en "Re-cargar" (en Mis Horas o en Home Seeker) **Then** me redirige al formulario de carga con esa semana y ese proyecto pre-seleccionados

- **Given** estoy en el formulario de re-carga pre-seleccionado **When** veo el formulario **Then** aparece un banner ámbar indicando "Re-cargando proyecto rechazado para la semana X"

- **Given** envío la re-carga **When** el backend la procesa **Then** se crea una nueva línea con aprobación PENDIENTE para ese proyecto en esa semana (la rechazada queda como histórico, su aprobación en RECHAZADO)

- **Given** tengo un proyecto con una línea activa cuya aprobación es PENDIENTE o APROBADO en una semana **When** intento cargar nuevamente ese proyecto para la misma semana **Then** recibo error de duplicado y no puedo enviarlo

### Supuestos y riesgos

- El seeker no puede editar horas cargadas (no hay PUT de ajuste). Si una observación modifica las horas, es el gestor quien las ajusta al momento de observar.
- Esta historia reemplaza a la anterior US-003 (Ajustar horas observadas), que fue eliminada del sistema (2026-05-21).

### Estado

✅ Implementada
