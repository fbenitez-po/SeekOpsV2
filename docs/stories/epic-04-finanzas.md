# Epic 04 — Finanzas y Comercial

---

## US-401: Gestionar períodos mensuales

### Historia de usuario

Como Admin, quiero crear y gestionar períodos mensuales, para organizar el registro de ingresos y costos por mes.

### Criterios de aceptación

- **Given** estoy en el módulo de Finanzas **When** hago clic en "Períodos" → "Crear período" **Then** se abre formulario con: año, mes (selector), estado (Abierto/Cerrado)

- **Given** completo el formulario **When** hago clic en "Crear" **Then** el período se crea con estado "Abierto" y aparece en el listado

- **Given** hay un período abierto **When** hago clic en "Cerrar período" **Then** se muestra confirmación: "Al cerrar el período no se podrán agregar ingresos ni costos. ¿Continuar?" — si confirmo, el período queda en estado "Cerrado"

- **Given** hay un período cerrado **When** intento agregar ingresos o costos a ese período **Then** el sistema muestra error "El período está cerrado"

- **Given** veo el listado de períodos **When** filtro por año **Then** veo todos los meses de ese año con su estado (Abierto/Cerrado) y totales resumidos

### Supuestos y riesgos

- No pueden existir dos períodos con el mismo mes/año
- Un período cerrado no se puede reabrir desde la UI (requiere acción manual en BD)
- Los períodos son globales, no por proyecto

### Estado

✅ Lista para desarrollo

---

## US-402: Registrar ingresos por proyecto y período

### Historia de usuario

Como Admin, quiero registrar los ingresos de cada proyecto en un período mensual, para llevar control financiero por proyecto.

### Criterios de aceptación

- **Given** estoy en un período abierto **When** hago clic en "Ingresos" → "Agregar ingreso" **Then** se abre formulario con: proyecto (dropdown de activos), período (selector de períodos abiertos), monto, moneda, descripción (opcional)

- **Given** completo el formulario **When** hago clic en "Guardar" **Then** el ingreso se registra y aparece en la tabla del período con el proyecto asociado

- **Given** hay ingresos registrados en un período **When** veo el resumen del período **Then** veo el total de ingresos agrupado por proyecto

- **Given** edito un ingreso existente **When** cambio el monto y guardo **Then** el total del período se recalcula automáticamente

- **Given** intento registrar un ingreso en un período cerrado **When** guardo **Then** el sistema muestra error "No se pueden registrar ingresos en un período cerrado"

### Supuestos y riesgos

- Un proyecto puede tener múltiples registros de ingreso en el mismo período
- Los montos se almacenan en la moneda indicada (no hay conversión automática)
- Los ingresos no se eliminan, solo se editan (para mantener auditoría)

### Estado

✅ Lista para desarrollo

---

## US-403: Registrar gastos administrativos por período

### Historia de usuario

Como Admin, quiero registrar los gastos administrativos del período, para conocer los costos generales del mes.

### Criterios de aceptación

- **Given** estoy en un período abierto **When** hago clic en "Gastos administrativos" → "Agregar gasto" **Then** se abre formulario con: descripción, monto, moneda, período (selector)

- **Given** completo el formulario **When** hago clic en "Guardar" **Then** el gasto se registra y aparece en la tabla de gastos del período

- **Given** hay gastos registrados **When** veo el resumen del período **Then** veo el total de gastos administrativos del mes

- **Given** edito un gasto **When** cambio el monto y guardo **Then** el total del período se actualiza

- **Given** el período está cerrado **When** intento agregar un gasto **Then** el sistema muestra error "El período está cerrado"

### Supuestos y riesgos

- Los gastos administrativos son generales (no están vinculados a un proyecto específico)
- No se eliminan, solo se editan

### Estado

✅ Lista para desarrollo

---

## US-404: Registrar costos de venta por período

### Historia de usuario

Como Admin, quiero registrar los costos de venta del período, para calcular el margen real de cada mes.

### Criterios de aceptación

- **Given** estoy en un período abierto **When** hago clic en "Costos de venta" → "Agregar costo" **Then** se abre formulario con: descripción, monto, moneda, período (selector), proyecto asociado (opcional)

- **Given** completo el formulario **When** hago clic en "Guardar" **Then** el costo se registra y aparece en la tabla de costos del período

- **Given** hay costos de venta registrados **When** veo el resumen del período **Then** veo el total de costos de venta, con detalle por proyecto si aplica

- **Given** edito un costo **When** cambio el monto y guardo **Then** el total del período se actualiza

- **Given** el período está cerrado **When** intento agregar un costo de venta **Then** el sistema muestra error "El período está cerrado"

### Supuestos y riesgos

- Un costo de venta puede estar vinculado o no a un proyecto específico
- No se eliminan, solo se editan

### Estado

✅ Lista para desarrollo

---

## US-405: Gestionar costos por persona

### Historia de usuario

Como Admin, quiero definir los costos mensuales de cada empleado (remuneración, días hábiles, horas por día), para calcular el costo real por hora de cada seeker.

### Criterios de aceptación

- **Given** estoy en el módulo de Finanzas → "Costos por persona" **When** hago clic en "Agregar costo" **Then** se abre formulario con: usuario (dropdown), período (selector), remuneración mensual, días hábiles del mes, horas por día

- **Given** completo el formulario **When** hago clic en "Guardar" **Then** el costo queda registrado para ese usuario y período

- **Given** hay costos registrados **When** veo el listado **Then** veo todos los empleados con su costo del período, el costo calculado por hora (remuneración / días hábiles / horas por día), y el total de horas reales cargadas en el período

- **Given** edito el registro de un empleado **When** cambio remuneración o días hábiles y guardo **Then** el costo por hora se recalcula automáticamente

- **Given** un empleado no tiene costo registrado en un período **When** veo el listado **Then** aparece con indicador "Sin costo registrado"

### Supuestos y riesgos

- El costo por hora se calcula en frontend: `remuneración / días_hábiles / horas_por_día`
- Un empleado puede tener costos distintos en distintos períodos (cambios de sueldo)
- Se puede registrar solo un costo por persona por período

### Estado

✅ Lista para desarrollo

---

## US-406: Registrar propuesta o contrato comercial

### Historia de usuario

Como Admin, quiero registrar propuestas y contratos vinculados a proyectos, para hacer seguimiento del estado comercial de cada proyecto.

### Criterios de aceptación

- **Given** estoy en el módulo Comercial **When** hago clic en "Registros comerciales" → "Nuevo registro" **Then** se abre formulario con: proyecto (dropdown), responsable (dropdown de usuarios), tipo de documento (dropdown), precio, moneda (dropdown), estado de facturación (dropdown), descripción (opcional)

- **Given** completo el formulario **When** hago clic en "Guardar" **Then** el registro se crea y aparece en el listado asociado al proyecto

- **Given** hay registros comerciales **When** filtro por proyecto **Then** veo todos los registros de ese proyecto con su estado de facturación

- **Given** edito un registro **When** cambio el estado de facturación y guardo **Then** el registro se actualiza y el cambio queda en auditoría

- **Given** veo el listado **When** un registro tiene estado "Pendiente de facturación" **Then** aparece destacado visualmente para facilitar el seguimiento

### Supuestos y riesgos

- Un proyecto puede tener múltiples registros comerciales (propuesta inicial + contrato + adenda, etc.)
- Los estados de facturación se configuran en la tabla `tipos_documento` y en un enum predefinido
- Los registros no se eliminan, solo se editan

### Estado

✅ Lista para desarrollo

---

## US-407: Gestionar tipos de documento comercial

### Historia de usuario

Como Admin, quiero mantener el catálogo de tipos de documento comercial (propuesta, contrato, orden de compra, etc.), para clasificar correctamente los registros comerciales.

### Criterios de aceptación

- **Given** estoy en el módulo Comercial → "Tipos de documento" **When** accedo **Then** veo el listado de tipos de documento existentes con nombre y estado (Activo/Inactivo)

- **Given** hago clic en "Nuevo tipo" **When** completo nombre y guardo **Then** el tipo se crea como Activo y aparece disponible en el dropdown de registros comerciales

- **Given** edito un tipo de documento **When** cambio el nombre y guardo **Then** el tipo se actualiza en todos los registros que lo usan

- **Given** desactivo un tipo de documento **When** lo marco como Inactivo **Then** ya no aparece en el dropdown para nuevos registros, pero los registros existentes conservan el tipo

### Supuestos y riesgos

- Los tipos de documento son un catálogo global
- No se eliminan, solo se desactivan
- Hay un set inicial de tipos cargado en seeds (propuesta, contrato, orden de compra)

### Estado

✅ Lista para desarrollo
