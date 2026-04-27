# S-03-PROYECTO-CREAR — Crear proyecto

> Formulario para crear un nuevo proyecto. Incluye información básica, configuración y asignación inicial de gestor.

**Ruta:** `/admin/proyectos/crear`  
**Usuario:** Admin autenticado

---

## Detalles de campos

| Campo | Tipo | Requerido | Validación |
|-------|------|-----------|-----------|
| Código | Text | ✓ | Único, alfanumérico, máx 20 |
| Nombre | Text | ✓ | No vacío, máx 100 |
| Cliente | Dropdown | ✓ | Relacionado a tabla Clientes (activos) |
| Descripción | Textarea | No | Máx 500 |
| Segmentación | Dropdown | ✓ | Relacionado a Cliente |
| Categoría ingreso | Dropdown | ✓ | Tipos de categoría |
| Capa de productividad | Dropdown | No | Relacionado a config |
| Tipo de servicio | Dropdown | No | Tipo de trabajo |
| Gestor | Dropdown | ✓ | Usuario con rol Gestor (activo) |
| Estado | Radio/Checkbox | ✓ | Activo/Inactivo, por default Activo |
| Fecha inicio | Date | No | Formato DD/MM/YYYY |
| Fecha fin | Date | No | Formato DD/MM/YYYY, no anterior a inicio |

---

## Layout

```
┌──────────────────────────────────────────────┐
│ [← Volver]                                   │
│ "Crear proyecto"                             │
│                                              │
│ INFORMACIÓN BÁSICA                           │
│ ┌──────────────┬─────────────────────────┐  │
│ │ Código *     │ Nombre *                │  │
│ │ [    ]       │ [                    ]  │  │
│ └──────────────┴─────────────────────────┘  │
│                                              │
│ Cliente *             Descripción            │
│ [Dropdown ▼]          [Textarea...        ]  │
│ (Acme Corp)           (opcional)            │
│                                              │
│ CONFIGURACIÓN                                │
│ ┌──────────────┬─────────────────────────┐  │
│ │ Segmentación │ Categoría ingreso *     │  │
│ │ [Dropdown ▼] │ [Dropdown ▼]           │  │
│ └──────────────┴─────────────────────────┘  │
│                                              │
│ Capa productividad    Tipo de servicio      │
│ [Dropdown ▼]          [Dropdown ▼]         │
│                                              │
│ Gestor *              Estado *              │
│ [Dropdown ▼]          ☑ Activo ☐ Inactivo  │
│                                              │
│ FECHAS                                       │
│ ┌──────────────┬─────────────────────────┐  │
│ │ Fecha inicio │ Fecha fin               │  │
│ │ [DD/MM/YYYY] │ [DD/MM/YYYY]           │  │
│ └──────────────┴─────────────────────────┘  │
│                                              │
│ [Crear proyecto]  [Cancelar]                │
│                                              │
└──────────────────────────────────────────────┘
```

---

## Estados

**Default (formulario vacío):**
- Campos vacíos
- "Estado" = Activo (por default)
- Botón "Crear proyecto" deshabilitado hasta completar campos requeridos

**Guardando:**
- Spinner en botón
- Campos deshabilitados

**Éxito:**
- POST /projects → Toast "Proyecto creado"
- Modal/Alert: "¿Quieres asignar usuarios ahora?" [Sí] [Después]
- Si sí → Navega a S-03-PROYECTO-ASIGNAR-USUARIOS
- Si después → Redirecciona a S-03-PROYECTOS-LISTA

**Error:**
- Alert rojo (código duplicado, validaciones fallidas)
- Mantiene datos en formulario

---

## Validaciones

- **Código:** Único, solo alfanuméricos + guiones
- **Nombre:** No vacío, máx 100
- **Cliente:** Debe ser activo
- **Segmentación:** Debe corresponder a Cliente seleccionado
- **Gestor:** Usuario debe tener rol Gestor y estar activo
- **Fecha fin:** No puede ser anterior a Fecha inicio

---

## Comportamiento

- Al cambiar Cliente → Actualizar opciones de Segmentación
- Gestor dropdown → Mostrar solo usuarios con rol Gestor activos

---

## Acciones

| Acción | Resultado |
| ------ | --------- |
| Seleccionar Cliente | Actualizar Segmentación |
| Completar requeridos | Habilitar botón Crear |
| Crear | POST /projects → Modal asignar usuarios |
| Cancelar | Regresa a S-03-PROYECTOS-LISTA |

---

**Relacionado:** Flujo F-11 (Gestión proyectos), S-03-PROYECTO-EDITAR, S-03-PROYECTO-ASIGNAR-USUARIOS
