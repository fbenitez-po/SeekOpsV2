# S-03-PROYECTO-EDITAR — Editar proyecto

> Formulario para editar datos de un proyecto existente. Incluye información básica, cliente, configuración y usuarios asignados.

**Ruta:** `/admin/proyectos/:id/editar`  
**Usuario:** Admin autenticado

---

## Componentes y layout

```
┌──────────────────────────────────────────────────────────┐
│ [← Volver]                                               │
│                                                          │
│ "Editar proyecto: ProyA"                                 │
│                                                          │
│ ════════════════════════════════════════════════════════ │
│ INFORMACIÓN BÁSICA (Editables)                           │
│ ════════════════════════════════════════════════════════ │
│                                                          │
│ Código *              │ Nombre *                         │
│ [PROJA        ]       │ [ProyA Development       ]       │
│                                                          │
│ Cliente *             │ Descripción                      │
│ [Dropdown ▼]          │ [Textarea...                ]    │
│ (Acme Corp)           │ (opcional)                       │
│                                                          │
│ ════════════════════════════════════════════════════════ │
│ CONFIGURACIÓN (Editables)                                │
│ ════════════════════════════════════════════════════════ │
│                                                          │
│ Segmentación *        │ Categoría ingreso *              │
│ [Dropdown ▼]          │ [Dropdown ▼]                    │
│                                                          │
│ Capa de productividad │ Tipo de servicio                │
│ [Dropdown ▼]          │ [Dropdown ▼]                    │
│                                                          │
│ Gestor *              │ Estado *                         │
│ [Dropdown ▼]          │ ☑ Activo  ☐ Inactivo           │
│ (Usuario X)           │                                  │
│                                                          │
│ ════════════════════════════════════════════════════════ │
│ FECHAS                                                   │
│ ════════════════════════════════════════════════════════ │
│                                                          │
│ Fecha inicio          │ Fecha fin                        │
│ [DD/MM/YYYY]          │ [DD/MM/YYYY]                     │
│ (opcional)            │ (opcional)                       │
│                                                          │
│ ════════════════════════════════════════════════════════ │
│ USUARIOS ASIGNADOS                                       │
│ ════════════════════════════════════════════════════════ │
│                                                          │
│ [Usuario A - Seeker] [Usuario B - Gestor]               │
│ [Usuario C - Seeker] [+ Agregar]                        │
│                                                          │
│ [Guardar]  [Cancelar]                                   │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## Detalles de campos

| Campo | Tipo | Editable | Obligatorio | Validación |
|-------|------|----------|-------------|-----------|
| Código | Text | Sí | ✓ | Único, alfanumérico, máx 20 |
| Nombre | Text | Sí | ✓ | No vacío, máx 100 |
| Cliente | Dropdown | Sí | ✓ | Relacionado a tabla Clientes |
| Descripción | Textarea | Sí | No | Máx 500 |
| Segmentación | Dropdown | Sí | ✓ | Relacionado a Cliente |
| Categoría ingreso | Dropdown | Sí | ✓ | Tipos de categoría |
| Capa de productividad | Dropdown | Sí | No | Relacionado a tablas config |
| Tipo de servicio | Dropdown | Sí | No | Tipo de trabajo (Consultoría, Desarrollo, etc) |
| Gestor | Dropdown | Sí | ✓ | Usuario con rol Gestor |
| Estado | Radio/Checkbox | Sí | ✓ | Activo/Inactivo |
| Fecha inicio | Date | Sí | No | Formato DD/MM/YYYY |
| Fecha fin | Date | Sí | No | Formato DD/MM/YYYY, no puede ser anterior a inicio |
| Usuarios asignados | Multi-select | Sí | No | Chips/badges removibles |

---

## Comportamiento

- Campos rellenados con datos actuales
- Validaciones en tiempo real
- Botón "Guardar" habilitado si hay cambios
- Dropdowns cargan opciones relacionadas (ej: si cambio Cliente, actualizo Segmentación)

---

## Validaciones

- **Código:** Debe ser único, solo alfanuméricos + guiones
- **Nombre:** No vacío, máx 100 caracteres
- **Cliente:** Obligatorio, debe ser un cliente activo
- **Gestor:** Obligatorio, debe ser un usuario con rol Gestor
- **Fecha fin:** No puede ser anterior a Fecha inicio
- **Segmentación:** Debe corresponder al Cliente seleccionado

---

## Acciones disponibles

| Acción | Componente | Resultado |
| ------ | ---------- | --------- |
| Editar campo | Input/Dropdown | Validación en tiempo real |
| Cambiar Cliente | Dropdown | Actualiza opciones de Segmentación |
| [+ Agregar] Usuario | Botón | Modal/Dropdown para seleccionar usuario y rol |
| [X] en chip Usuario | Botón | Remueve usuario del proyecto |
| [Guardar] | Button | PUT /projects/:id → S-03-PROYECTOS-LISTA |
| [Cancelar] | Button | Regresa a S-03-PROYECTOS-LISTA |
| [← Volver] | Link | Regresa a S-03-PROYECTOS-LISTA |

---

## Responsive

- Mobile: Secciones apiladas, campos stacked
- Desktop: Dos columnas donde sea posible

---

**Relacionado:** Flujo F-11 (Gestión proyectos)
