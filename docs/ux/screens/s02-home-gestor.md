# S-02-HOME-GESTOR — Hogar Gestor

> Dashboard del gestor. Muestra: (1) horas pendientes de aprobación de su equipo, (2) horas pendientes propias (si también es Seeker en otros proyectos).

**Ruta:** `/home` (acceso restringido a Gestor)  
**Usuario:** Gestor autenticado

---

## Componentes y layout

```
┌─────────────────────────────────────────────────────────┐
│ Header (Logo + Usuario + Menú)                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ SECCIÓN 1: HORAS PENDIENTES DE APROBACIÓN              │
│ "Horas de tu equipo pendientes de aprobación"          │
│                                                         │
│ [+ CARGAR MIS HORAS]                                    │
│                                                         │
│ Filtros: [Proyecto ▼] [Seeker ▼] [Limpiar]             │
│                                                         │
│ Tabla:                                                  │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Seeker  │ Proyecto │ Semana │ Horas │ Acciones    │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │ Juan    │ ProyA    │ S14/24 │ 40h   │ [Aprobar]   │ │
│ │         │          │        │       │ [Observar]  │ │
│ │         │          │        │       │ [Rechazar]  │ │
│ │ María   │ ProyB    │ S14/24 │ 38h   │ [Aprobar]   │ │
│ │         │          │        │       │ [Observar]  │ │
│ │         │          │        │       │ [Rechazar]  │ │
│ └─────────────────────────────────────────────────────┘ │
│ Paginación + Totales                                    │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ SECCIÓN 2: MIS HORAS PENDIENTES (si aplica)            │
│ "Tienes horas pendientes de aprobación en otros        │
│  proyectos donde eres Seeker"                          │
│                                                         │
│ Tabla similar (mis cargas, sin columna Seeker)         │
│ [Ajustar] (si observadas) | [Ver más]                  │
│                                                         │
│ (O mensaje: "Ninguna" si todo está aprobado)           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Detalles de secciones

### Sección 1 — Horas Pendientes de Aprobación

**Título:** "Horas de tu equipo pendientes de aprobación"

**Botón:** "[+ CARGAR MIS HORAS]" (primary, rojo/warning) 
- Navega a S-02-CARGAR-HORAS-GESTOR

**Filtros:**
- **Proyecto** (Dropdown multi-select): Proyectos donde es gestor
- **Seeker** (Dropdown multi-select): Miembros del equipo
- **[Limpiar]** (Link, visible solo si hay filtros activos)

**Tabla:**
- **Seeker** — Nombre del seeker
- **Proyecto** — Nombre del proyecto
- **Semana** — Formato "S14/24"
- **Horas** — Total de horas + "h"
- **Acciones** — Tres botones:
  - **[Aprobar]** → Modal de confirmación
  - **[Observar]** → S-02-OBSERVACION
  - **[Rechazar]** → S-02-RECHAZO

**Paginación:**
- "Página X de Y" + botones [< >]
- Máx 10 registros por página

**Totales:**
- Al pie: "Pendientes: XXh | Total buscado: YYh"

**Comportamiento:**
- Tabla ordenada por fecha de carga (más recientes primero)
- Filtros se aplican en tiempo real

---

### Sección 2 — Mis Horas Pendientes (condicional)

**Cuándo aparece:**
- Solo si el gestor también tiene rol Seeker en otro(s) proyecto(s)
- Solo si tiene cargas pendientes de aprobación

**Título:** "Tienes horas pendientes de aprobación en otros proyectos donde eres Seeker"

**Tabla:**
- Igual a S-01-HOME-SEEKER pero sin Seeker (es obvio que son mías)
- Columnas: Proyecto | Semana | Horas | Estado | Acciones
- Botones: [Ajustar] (si observadas) | [Ver más]

**Si no hay horas pendientes:**
- Mostrar: "Ninguna" (gris, con ícono checkmark)

---

## Estados

### Default (con pendientes)
- S1: Tabla llena con horas pendientes
- S2: Visible si hay horas propias pendientes
- Botones de acción activos

### Vacío (sin pendientes)
- S1: Mostrar "No hay horas pendientes de aprobación"
- S2: Mostrar "Ninguna" o no mostrar sección
- Botón "[+ CARGAR MIS HORAS]" visible

### Cargando
- Skeleton de tabla (3-5 filas)
- Spinner en lugar de botones

### Error
- Alert rojo: "Error al cargar las horas. Intenta de nuevo."

---

## Acciones disponibles

| Acción | Componente | Resultado |
| ------ | ---------- | --------- |
| Clic [+ CARGAR MIS HORAS] | Botón | Navega a S-02-CARGAR-HORAS-GESTOR |
| Seleccionar Proyecto/Seeker | Dropdown | Filtra tabla S1 en tiempo real |
| Clic [Limpiar] | Link | Limpia todos los filtros |
| Clic [Aprobar] | Botón S1 | Modal "¿Aprobar estas horas?" → Aprueba y refresca |
| Clic [Observar] | Botón S1 | Navega a S-02-OBSERVACION |
| Clic [Rechazar] | Botón S1 | Navega a S-02-RECHAZO |
| Clic [Ajustar] | Botón S2 | Navega a S-01-AJUSTAR-HORAS |
| Clic [Ver más] | Botón S2 | Expande lista de mis horas (si hay varias) |
| Clic paginación [< >] | Botones | Navega a página anterior/siguiente |
| Clic usuario/avatar | Header | Abre dropdown: Perfil, Cerrar sesión |

---

## Responsive

### Mobile (< 640px)
- **Secciones:** Apiladas
- **Botón:** Ancho 100%, sticky al scroll
- **Filtros:** Stack vertical
- **Tabla:** Cards apiladas (nombre, proyecto, semana, horas)
- **Acciones:** Collapse/expand por fila

### Tablet/Desktop
- Layout natural con tabla completa

---

## Fuera de alcance

- Historial de aprobaciones previas
- Reportes de velocidad de aprobación
- Búsqueda por texto libre

---

**Relacionado:** Flujo F-06 (aprobaciones), F-07 (cargas propias)
