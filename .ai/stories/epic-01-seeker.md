# Epic 01 — Seeker: Carga y Seguimiento de Horas

---

## US-001: Registrar horas semanales en un proyecto

### Historia de usuario

Como Seeker, quiero registrar mis horas trabajadas en un proyecto para una semana específica, para mantener un registro preciso de mi tiempo.

### Criterios de aceptación

**Selector de Semana:**
- **Given** estoy en formulario de carga **When** veo selector **Then** tengo botones [← semana →] con código "SAAS/YY" (ej: S15/24) y rango "Lun X al Dom Y mes año"
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

## US-002: Visualizar historial de horas cargadas

### Historia de usuario

Como Seeker, quiero ver todas mis horas registradas, para hacer seguimiento de lo que he cargado.

### Criterios de aceptación

- **Given** estoy en el home **When** hago clic en "Mis horas" **Then** veo una lista con todas mis cargas: semana, proyecto, horas, estado, fecha de carga

- **Given** veo el historial **When** aplico filtro por "Proyecto" **Then** la lista se filtra solo a ese proyecto

- **Given** veo el historial **When** aplico filtro por "Estado" (Pendiente/Aprobado/Rechazado/Observado) **Then** la lista se filtra correctamente

- **Given** veo horas con estado "Observado" **When** hago clic en una fila **Then** veo el comentario del gestor que observó las horas

- **Given** veo horas con estado "Rechazado" **When** hago clic en una fila **Then** veo la razón del rechazo (sin opción de editar o cambiar)

### Supuestos y riesgos

- Se asume que hay suficientes datos para justificar paginación (opción: mostrar últimas 20, cargar más)

### Estado

✅ Lista para desarrollo

---

## US-003: Ajustar horas observadas

### Historia de usuario

Como Seeker, quiero corregir mis horas cuando el gestor me envía una observación, para resolver el error.

### Criterios de aceptación

**Acceso a Ajuste:**
- **Given** tengo horas con estado "Observado" **When** hago clic en [Ajustar] **Then** me redirige a S-01-AJUSTAR-HORAS
- **Given** abro formulario de ajuste **When** veo el contenido **Then** muestra: "Ajustando: [Proyecto] - [Semana]" como referencia

**Campos de Ajuste:**
- **Given** estoy en formulario de ajuste **When** veo campos **Then** son editables: Horas | Horas extra | Comentario
- **Given** edito Horas **When** ingreso valor > 24 ó < 0 **Then** muestro error: "Máximo 24 horas"
- **Given** edito Horas extra **When** ingreso valor > 8 ó < 0 **Then** muestro error: "Máximo 8 horas extras"
- **Given** edito Comentario **When** supero 500 caracteres **Then** valido límite
- **Given** completo ajustes **When** hago clic [Guardar ajuste] **Then** PUT /time-entries/:id → Confirmación

**Post-Ajuste:**
- **Given** he guardado el ajuste **When** redirijo a confirmación **Then** veo: "Horas ajustadas y reenviadas a aprobación"
- **Given** he ajustado horas **When** vuelvo a historial **Then** veo AMBAS versiones: Original (tachada) + Ajustada (actual)
- **Given** ajusté horas **When** el gestor lo revisa **Then** recibe email: "Horas ajustadas por [Seeker] - [Proyecto] [Semana]"
- **Given** envío ajuste **When** vuelven a "Observado" por gestor **Then** puedo ajustar de nuevo (iterativo)

### Supuestos y riesgos

- Se asume que queda auditoria completa de cambios (quién cambió qué, cuándo)
- El email se dispara automáticamente cuando se envía un ajuste

### Estado

✅ Lista para desarrollo
