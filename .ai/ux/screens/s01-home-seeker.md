# S-01-HOME-SEEKER — Hogar Seeker

> Dashboard principal del seeker. Muestra resumen: semanas pendientes de carga, horas observadas, histórico de 3 últimas semanas. Acceso rápido a funcionalidad de carga.

**Ruta:** `/home` (acceso restringido a Seeker)  
**Usuario:** Seeker autenticado

---

## Componentes y layout

```
┌─────────────────────────────────────────────────────────┐
│ Header (Logo + Usuario + Menú)                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ SECCIÓN 1: SEMANAS PENDIENTES DE CARGA                 │
│ ┌───────────────────────────────────────────────────┐   │
│ │ "Tienes pendientes estas semanas:"                │   │
│ │ [S15/24] [S16/24] [S17/24]                        │   │
│ │ (badges navegables)                               │   │
│ └───────────────────────────────────────────────────┘   │
│                                                         │
│ SECCIÓN 2: HORAS OBSERVADAS O CON ACCIONABLES         │
│ ┌───────────────────────────────────────────────────┐   │
│ │ "Requieren tu atención:" (si hay)                 │   │
│ │ • ProyA - S14/24: 🔍 Observado [Ajustar]         │   │
│ │ • ProyB - S13/24: 🔍 Observado [Ajustar]         │   │
│ │ (o "Ninguna" si todas están OK)                  │   │
│ └───────────────────────────────────────────────────┘   │
│                                                         │
│ SECCIÓN 3: HISTÓRICO ÚLTIMAS 3 SEMANAS                 │
│ ┌───────────────────────────────────────────────────┐   │
│ │ S14/24 - Aprobadas: 40h                           │   │
│ │ S13/24 - Observadas: 35h [Ajustar]                │   │
│ │ S12/24 - Aprobadas: 40h                           │   │
│ └───────────────────────────────────────────────────┘   │
│                                                         │
│ SECCIÓN 4: ACCIONES RÁPIDAS                            │
│ ┌───────────────────────────────────────────────────┐   │
│ │ [+ Cargar nuevas horas]                           │   │
│ └───────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Estados

### Default (con datos)

**Sección 1 — Semanas Pendientes:**
- Título: "Tienes pendientes estas semanas:"
- Badges con semanas (ej: S15/24, S16/24) con fondo warning/secondary
- Clickeables → Navegan/subrayan en Sección 4
- Si no hay pendientes: Ocultar sección

**Sección 2 — Horas Observadas o con Accionables:**
- Título: "Requieren tu atención:" (solo si hay)
- Lista de items: "• [Proyecto] - [Semana]: 🔍 Observado [Ajustar]"
- Botón "Ajustar" → Navega a S-01-AJUSTAR-HORAS
- Si no hay pendientes: Mostrar "Ninguna"

**Sección 3 — Histórico últimas 3 semanas:**
- 3 líneas: "S14/24 - Aprobadas: 40h" (con badges de estado)
- Click en línea → Abre modal de detalles (opcional)
- Mostrar estado (Aprobado ✓, Observado 🔍, Pendiente ⏳)

**Sección 4 — Acciones Rápidas:**
- Botón único: **[+ Cargar nuevas horas]** (primary)
  - Navega a S-01-CARGAR-HORAS (pantalla dedicada)
  - Permite cargar múltiples proyectos sin repetir
  - Selector de semana completo

---

### Comportamiento Sección 4

- **Botón [+ Cargar nuevas horas]:**
  - Click → Navega a `/cargar-horas` (S-01-CARGAR-HORAS)
  - Pantalla dedicada con formulario completo
  - Validaciones y manejo de errores en esa pantalla

---

### Vacío (usuario nuevo)

- Ocultar Sección 1, 2 y 3
- Mostrar solo Sección 4 con mensaje "Comienza cargando tus primeras horas"
- Botón "Cargar" visible

---

### Cargando (post-submit)

- Spinner en botón Cargar
- Filas deshabilitadas
- Botón "+ Agregar proyecto" deshabilitado

---

### Éxito

- Redirige a S-01-CONFIRMACION-CARGA

---

## Acciones disponibles

| Acción | Componente | Resultado |
| ------ | ---------- | --------- |
| Clic en badge de semana pendiente (S1) | Badge | Navega a S-01-CARGAR-HORAS con semana pre-seleccionada |
| Clic en "Ajustar" (S2) | Botón | Navega a `/ajustar-horas/[id]` (S-01-AJUSTAR-HORAS) |
| Clic en línea de histórico (S3) | Línea | Abre modal con detalles de la semana (opcional) |
| Clic [+ Cargar nuevas horas] (S4) | Botón | Navega a `/cargar-horas` (S-01-CARGAR-HORAS) |
| Clic en usuario/avatar | Header | Abre dropdown menú: Perfil, Cerrar sesión |

---

## Responsive

### Mobile (< 640px)

- **Secciones 1-3** — Apiladas, badges/items ocupan 100% ancho
- **Sección 4** — 
  - Tabla de proyectos: Mostrar como cards apiladas (proyecto, horas, extras, comentario)
  - Botón "+ Agregar proyecto" ancho 100%
  - Botones Cargar/Cancelar apilados, ancho 100%, altura 44px sticky

### Tablet (640px - 1024px)

- **Secciones 1-3** — Dos columnas si es posible
- **Sección 4** — Tabla con scroll horizontal si es necesario
- **Botones** — Lado a lado, 50% ancho cada uno

### Desktop (> 1024px)

- **Secciones 1-4** — Layout natural, máx ancho 1200px
- **Sección 4** — Tabla con columnas visibles completas
- **Botones** — Lado a lado, left-aligned

---

## Accessibility

- **Labels en filtros** — Asociadas con `for` attribute
- **Table headers** — `<th scope="col">` correctos
- **ARIA** — `aria-sort="none|ascending|descending"` en headers (si son sortables)
- **Focus visible** — En botones y filtros
- **Color no es única indicación** — Estados tienen ícono + color + texto

---

## Interacciones especiales

**Filtros multi-select:**
- Dropdown que permite marcar/desmarcar múltiples opciones
- Mostrar chips/badges de filtros activos arriba o dentro del dropdown
- Aplicar filtros sin reload (AJAX)

**Lazy loading (post-MVP):**
- Opción de infinite scroll en lugar de paginación
- Cargar más registros al scroll down

**Sorteo de columnas (post-MVP):**
- Click en header para ordenar (ascendente/descendente)
- Ícono ↑↓ en header activo

---

## Fuera de alcance

- **Exportar a CSV/PDF** — Post-MVP
- **Editar horas desde tabla** — Debe ir a pantalla de ajuste
- **Eliminar horas** — No se pueden eliminar, solo se rechazan
- **Búsqueda por texto libre** — Solo filtros por dropdown
- **Historial de cambios** — Quién aprobó/observó cuándo (post-MVP)
- **Notificaciones in-app** — Email sí, pero notificaciones en UI post-MVP

---

**Relacionado:** Flujo F-02 (Cargar), F-03 (Ajustar), F-04 (Ver historial)
