# S-03-CLIENTE-EDITAR — Editar cliente

> Formulario para editar datos de un cliente existente. Incluye información comercial, contacto y estado.

**Ruta:** `/admin/clientes/:id/editar`  
**Usuario:** Admin autenticado

---

## Componentes y layout

```
┌──────────────────────────────────────────────────────┐
│ [← Volver]                                           │
│                                                      │
│ "Editar cliente: Acme Corp"                          │
│                                                      │
│ ════════════════════════════════════════════════════ │
│ INFORMACIÓN COMERCIAL (Editables)                    │
│ ════════════════════════════════════════════════════ │
│                                                      │
│ Nombre *              │ Razón social                │
│ [Acme Corp      ]     │ [Acme Corp S.A.      ]      │
│                                                      │
│ Razón comercial       │ RUC *                       │
│ [Acme Consulting ]    │ [20123456789         ]      │
│                                                      │
│ ════════════════════════════════════════════════════ │
│ CONTACTO (Editables)                                │
│ ════════════════════════════════════════════════════ │
│                                                      │
│ Nombre contacto       │ Teléfono                    │
│ [Carlos López    ]    │ [+5165432100         ]      │
│                                                      │
│ Email contacto        │ Dirección                   │
│ [carlos@acme.com ]    │ [Calle Falsa 123     ]      │
│                                                      │
│ ════════════════════════════════════════════════════ │
│ ESTADO (Editable)                                   │
│ ════════════════════════════════════════════════════ │
│                                                      │
│ Categoría usuario *   │ Segmentación *              │
│ [Dropdown ▼]          │ [Dropdown ▼]                │
│                                                      │
│ Sector                                               │
│ [Dropdown ▼]                                         │
│                                                      │
│ Activo               ☑ Sí   ☐ No                   │
│                                                      │
│ ════════════════════════════════════════════════════ │
│ PROYECTOS ASOCIADOS                                 │
│                                                      │
│ [ProyA] [ProyB] [+ Agregar]                         │
│                                                      │
│ ════════════════════════════════════════════════════ │
│ USUARIOS ASOCIADOS POR PROYECTO                     │
│                                                      │
│ ProyA: [Usuario X] [Usuario Y] [+ Agregar]        │
│ ProyB: [Usuario Z] [+ Agregar]                    │
│                                                      │
│ [Guardar]  [Cancelar]                               │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## Detalles de campos

| Campo | Tipo | Editable | Obligatorio | Validación |
|-------|------|----------|-------------|-----------|
| Nombre | Text | Sí | ✓ | No vacío, máx 100 |
| Razón social | Text | Sí | No | Máx 150 |
| Razón comercial | Text | Sí | No | Máx 150 |
| RUC | Text | Sí | ✓ | Formato numérico, 11-14 dígitos |
| Nombre contacto | Text | Sí | No | Máx 100 |
| Email contacto | Email | Sí | No | Validar formato email |
| Teléfono | Text | Sí | No | Formato telefónico |
| Dirección | Text | Sí | No | Máx 200 |
| Categoría de usuario | Dropdown | Sí | ✓ | Tipos de categoría |
| Segmentación | Dropdown | Sí | ✓ | Enterprise, Mid Market, SMB, etc |
| Sector | Dropdown | Sí | No | Industria/sector |
| Activo | Radio/Checkbox | Sí | — | Sí/No, inactivo = no visible en cargas |

### Sección: Proyectos Asociados

- **Componente:** Chips/badges de proyectos
- **Editable:** Sí
- **Acción:** [+ Agregar] → Modal/Dropdown para agregar proyectos
- **Acción:** [X] en cada chip → Remover proyecto del cliente

### Sección: Usuarios Asociados por Proyecto

- **Componente:** Por cada proyecto, lista de usuarios
- **Editable:** Sí
- **Formato:** "Proyecto A: [Usuario X] [Usuario Y]"
- **Acción:** [+ Agregar] → Modal para agregar usuario a ese proyecto

---

## Comportamiento

- Campos rellenados con datos actuales
- Validaciones en tiempo real
- Botón "Guardar" habilitado si hay cambios

---

## Acciones

| Acción | Resultado |
| ------ | --------- |
| Editar campo | Validación en tiempo real |
| Guardar | PUT /clients/:id → S-03-CLIENTES-LISTA |
| Cancelar | Regresa a S-03-CLIENTES-LISTA |

---

**Relacionado:** Flujo F-10 (Gestión clientes)
