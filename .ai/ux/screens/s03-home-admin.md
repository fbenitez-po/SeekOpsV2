# S-03-HOME-ADMIN — Hogar Admin

> Dashboard principal del admin. Muestra: (1) métricas clave, (2) acciones rápidas, (3) horas pendientes de aprobación global (vista de admin), (4) alertas/pendientes.

**Ruta:** `/home` (acceso restringido a Admin)  
**Usuario:** Admin autenticado

---

## Componentes y layout

```
┌────────────────────────────────────────────────────────────┐
│ Header (Logo + Usuario + Menú)                             │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ SECCIÓN 1: MÉTRICAS CLAVE (4 Cards)                        │
│                                                            │
│ ┌─────────────┐  ┌─────────────┐  ┌──────────┐ ┌─────────┐
│ │ 👥 48       │  │ 🏢 12       │  │ 📋 24    │ │ ⏳ 156  │
│ │ Usuarios    │  │ Clientes    │  │ Proyectos│ │ Horas   │
│ │ Activos     │  │ Activos     │  │ Activos  │ │ Pend.   │
│ └─────────────┘  └─────────────┘  └──────────┘ └─────────┘
│                                                            │
│ SECCIÓN 2: ACCIONES RÁPIDAS                                │
│                                                            │
│ [+ Nuevo Usuario] [+ Nuevo Cliente] [+ Nuevo Proyecto]   │
│                                                            │
│ SECCIÓN 3: HORAS PENDIENTES (Vista Global)                │
│                                                            │
│ "Horas de todos los proyectos pendientes de aprobación"  │
│                                                            │
│ Filtros: [Proyecto ▼] [Gestor ▼] [Seeker ▼] [Limpiar]    │
│                                                            │
│ Tabla:                                                     │
│ ┌────────────────────────────────────────────────────────┐
│ │ Seeker  │ Proyecto │ Semana │ Horas │ Gestor   │ Acc.  │
│ ├────────────────────────────────────────────────────────┤
│ │ Juan    │ ProyA    │ S14/24 │ 40h   │ Carlos   │ [→] │
│ │ María   │ ProyB    │ S14/24 │ 38h   │ Laura    │ [→] │
│ └────────────────────────────────────────────────────────┘
│ Paginación + "Pendientes: XXh | Total buscado: YYh"       │
│                                                            │
│ SECCIÓN 4: ALERTAS/PENDIENTES (si hay)                    │
│                                                            │
│ ⚠️ 5 usuarios sin completar información de trabajo        │
│ ⚠️ 2 clientes inactivos (últimas 30 días sin movimiento) │
│ ⚠️ 1 proyecto con fecha de fin vencida                   │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## Detalles de secciones

### Sección 1 — Métricas Clave (4 Cards)

**Card 1 — Usuarios:**
- Ícono: 👥
- Número: 48 (usuarios activos)
- Subtítulo: "Usuarios Activos"
- Click: Navega a S-03-USUARIOS-LISTA

**Card 2 — Clientes:**
- Ícono: 🏢
- Número: 12 (clientes activos)
- Subtítulo: "Clientes Activos"
- Click: Navega a S-03-CLIENTES-LISTA

**Card 3 — Proyectos:**
- Ícono: 📋
- Número: 24 (proyectos activos)
- Subtítulo: "Proyectos Activos"
- Click: Navega a S-03-PROYECTOS-LISTA

**Card 4 — Horas Pendientes:**
- Ícono: ⏳
- Número: 156 (horas)
- Subtítulo: "Horas Pendientes Aprobación"
- Click: Desplaza a Sección 3

**Comportamiento:**
- Cards clickeables (color cambia al hover)
- Números actualizados en tiempo real
- Si número = 0, mostrar "0" pero permitir navegar igual

### Sección 2 — Acciones Rápidas

- Tres botones: [+ Nuevo Usuario] [+ Nuevo Cliente] [+ Nuevo Proyecto]
- Navegan a formularios de creación (S-03-USUARIO-CREAR, S-03-CLIENTE-CREAR, S-03-PROYECTO-CREAR)

### Sección 3 — Horas Pendientes Global

**Título:** "Horas de todos los proyectos pendientes de aprobación"

**Filtros:**
- **Proyecto** (Dropdown multi-select)
- **Gestor** (Dropdown multi-select)
- **Seeker** (Dropdown multi-select)
- **[Limpiar]** (Link)

**Tabla:**
- **Seeker** — Nombre del seeker
- **Proyecto** — Nombre del proyecto
- **Semana** — Formato "S14/24"
- **Horas** — Total de horas
- **Gestor** — Gestor responsable
- **Acciones** — Botón [→] (ver detalles / panel de aprobación)

**Paginación:**
- Máx 10 registros por página
- "Página X de Y" + botones [< >]

**Totales:**
- Al pie: "Pendientes: XXh | Total buscado: YYh"

### Sección 4 — Alertas/Pendientes

**Muestra si hay:**
- ⚠️ "N usuarios sin completar información de trabajo"
- ⚠️ "N clientes inactivos (últimas 30 días sin movimiento)"
- ⚠️ "N proyectos con fecha de fin vencida"
- ⚠️ "N horas rechazadas sin resolución"

**Comportamiento:**
- Si no hay alertas: No mostrar sección
- Click en alerta: Navega a listado relevante con filtros pre-aplicados

---

## Estados

### Default (con datos)
- 4 cards con contadores
- Acciones rápidas visibles
- Tabla de horas pendientes
- Alertas mostradas (si hay)

### Vacío (sin horas pendientes)
- Cards siguen visibles
- Sección 3: Mostrar "No hay horas pendientes de aprobación"
- Sección 4: Mostrar solo alertas relevantes

### Cargando
- Skeleton cards (4)
- Skeleton tabla (3-5 filas)
- Spinner en secciones

---

## Acciones disponibles

| Acción | Componente | Resultado |
| ------ | ---------- | --------- |
| Clic en Card Usuarios | Card | Navega a S-03-USUARIOS-LISTA |
| Clic en Card Clientes | Card | Navega a S-03-CLIENTES-LISTA |
| Clic en Card Proyectos | Card | Navega a S-03-PROYECTOS-LISTA |
| Clic en Card Horas Pendientes | Card | Desplaza a Sección 3 |
| Clic [+ Nuevo Usuario] | Botón | Navega a S-03-USUARIO-CREAR |
| Clic [+ Nuevo Cliente] | Botón | Navega a S-03-CLIENTE-CREAR |
| Clic [+ Nuevo Proyecto] | Botón | Navega a S-03-PROYECTO-CREAR |
| Seleccionar filtros (S3) | Dropdowns | Filtra tabla en tiempo real |
| Clic [Limpiar] (S3) | Link | Limpia todos los filtros |
| Clic [→] (S3) | Botón | Abre modal con opciones: Aprobar/Observar/Rechazar |
| Clic en alerta (S4) | Alerta | Navega a listado con filtros pre-aplicados |
| Clic usuario/avatar | Header | Abre dropdown: Perfil, Cerrar sesión |

---

## Responsive

### Mobile (< 640px)
- Cards: Stack vertical (4 cards apiladas)
- Acciones: Stack vertical
- Tabla: Cards apiladas
- Filtros: Stack vertical

### Desktop
- Cards: Grid 4 columnas
- Acciones: Horizontal
- Tabla: Columnas visibles

---

**Relacionado:** Flujos F-09 a F-12 (gestión global)
