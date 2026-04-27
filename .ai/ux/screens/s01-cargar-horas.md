# S-01-CARGAR-HORAS — Formulario de carga de horas

> Formulario completo para que los seekers registren horas semanales por múltiples proyectos. Permite capturar semana (con navegación), proyectos (sin repetir), categoría condicional, horas, extras y comentarios.

**Ruta:** `/cargar-horas`  
**Usuario:** Seeker autenticado

---

## Componentes y layout

```
┌──────────────────────────────────────────────────────┐
│ [← Volver]                                           │
│                                                      │
│ "Cargar nuevas horas"                               │
│ "Registra las horas que trabajaste"                  │
│                                                      │
│ SELECTOR DE SEMANA                                   │
│ ┌────────────────────────────────────────────────┐   │
│ │ Semana: [←] S15/24 (semana actual) [→]         │   │
│ │ (navegación con flechas, cambios en tiempo real)│   │
│ └────────────────────────────────────────────────┘   │
│                                                      │
│ TABLA DE PROYECTOS A CARGAR                          │
│ ┌────────────────────────────────────────────────┐   │
│ │ Proyecto *      │ Categoría   │ Horas  │ Extras│   │
│ │ [Dropdown ▼]    │ [Dropdown ▼]│ [    ]│ [   ]│   │
│ │ Comentario (opcional)                          │   │
│ │ [Textarea...]                                  │   │
│ │ [X] Eliminar fila                              │   │
│ ├────────────────────────────────────────────────┤   │
│ │ Proyecto *      │ Categoría   │ Horas  │ Extras│   │
│ │ [Dropdown ▼]    │ [Dropdown ▼]│ [    ]│ [   ]│   │
│ │ Comentario (opcional)                          │   │
│ │ [Textarea...]                                  │   │
│ │ [X] Eliminar fila                              │   │
│ └────────────────────────────────────────────────┘   │
│                                                      │
│ [+ Agregar otro proyecto]                            │
│                                                      │
│ [Cargar] [Cancelar]                                  │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## Detalles de campos

### Semana
- **Componente:** Botones [←] + Display "S15/24" + Botones [→]
- **Default:** Semana actual (al ingresar a la página)
- **Rango:** Cualquier semana (sin límite retroactivo)
- **Navegación:** Cambio en tiempo real, actualiza semana disponible
- **Formato código:** "SAAS/YY" (ej: S15/24 = semana 15 de 2024)
- **Rango de días:** Lunes a domingo (ej: "Lun 20 al Dom 26 abr 2026")

### Tabla de Proyectos
**Proyecto (Dropdown, requerido):**
- Muestra solo proyectos asignados al seeker
- Excluye proyectos ya usados en otra fila (misma sección)
- Al seleccionar: Habilita resto de campos

**Categoría (Dropdown, condicional):**
- SOLO habilitado si Proyecto = "Area" (según config del cliente)
- Si no es "Area": Campo deshabilitado/gris
- Incluye opciones de categoría de ingreso

**Horas (Input numérico, requerido):**
- Rango: 0-24 (validación en tiempo real)
- Si > 24: Mostrar error "Máximo 24 horas"
- Required badge (*)

**Horas extra (Input numérico, opcional):**
- Rango: 0-8
- Si > 8: Mostrar error "Máximo 8 horas extras"

**Comentario (Textarea, opcional):**
- Max 500 caracteres
- Placeholder: "Notas sobre la carga..."

**[X] Eliminar fila:**
- Botón para remover una fila
- Visible en cada fila (excepto la primera si es la única)

---

## Comportamiento

### Default (formulario cargado)
- 1 fila vacía pre-cargada
- Semana pre-selecciona actual
- Botón "[+ Agregar otro proyecto]" habilitado
- Botón "Cargar" deshabilitado hasta tener al menos Proyecto + Horas en una fila

### Agregar fila
- Clic en "+ Agregar otro proyecto" agrega nueva fila abajo
- Dropdown de Proyecto excluye los ya usados
- Max 5 proyectos por carga (a definir con cliente si hay límite)

### Validación
**En tiempo real:**
- Horas: 0-24, no números negativos
- Extras: 0-8, no números negativos
- Proyecto: Si se repite, mostrar "Este proyecto ya está en esta carga"

**Al hacer submit:**
- Verificar que al menos una fila tenga Proyecto + Horas
- Si falta: Mostrar error "Completa al menos un proyecto"
- Mostrar errores en campos con borde rojo

---

## Estados

### Default
- Formulario vacío, 1 fila, botón Cargar deshabilitado

### Cargando (post-submit)
- Spinner en botón Cargar
- Campos deshabilitados
- No permitir agregar filas

### Éxito
- Redirige a S-01-CONFIRMACION-CARGA

### Duplicado en semana anterior
- Si Proyecto + Semana ya existe: Modal con opciones:
  - "Usar este" (edita existente)
  - "Crear nuevo" (nueva entrada)
  - "Cancelar"

---

## Acciones disponibles

| Acción | Componente | Resultado |
| ------ | ---------- | --------- |
| Clic [←] / [→] semana | Botones | Cambia semana, actualiza dropdown de proyectos |
| Seleccionar Proyecto | Dropdown | Habilita resto de campos, excluye proyecto de otras filas |
| Ingresar Horas/Extras | Input | Valida 0-24 y 0-8 respectivamente |
| Escribir Comentario | Textarea | Sin validación |
| Clic "+ Agregar otro proyecto" | Botón | Nueva fila abajo, lista sin proyectos usados |
| Clic [X] | Botón | Elimina fila |
| Clic "Cargar" | Button | POST /time-entries → S-01-CONFIRMACION-CARGA (si hay cambios) |
| Clic "Cancelar" | Button | Regresa a S-01-HOME-SEEKER (con warning si hay cambios) |
| Clic "← Volver" | Link | Regresa a S-01-HOME-SEEKER (con warning si hay cambios) |

---

## Responsive

### Mobile (< 640px)
- Semana: Botones [←] y [→] apilados, selector centrado
- Tabla: Mostrar como cards (proyecto, horas, extras, comentario)
- Botones: Apilados 100% ancho

### Desktop (> 640px)
- Semana: [←] | Display | [→] en línea
- Tabla: Columnas visibles
- Botones: Lado a lado

---

## Fuera de alcance

- Validación de máximo de horas totales por semana
- Integración con calendario visual
- Multiplicadores de tarifa
- Historial de cambios

---

**Relacionado:** Flujo F-02, S-01-HOME-SEEKER
