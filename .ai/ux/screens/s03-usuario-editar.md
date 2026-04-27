# S-03-USUARIO-EDITAR — Editar usuario

> Formulario para editar datos de un usuario existente. Incluye información personal, trabajo, permisos e histórico.

**Ruta:** `/admin/usuarios/:id/editar`  
**Usuario:** Admin autenticado

---

## Componentes y layout

```
┌──────────────────────────────────────────────────────────┐
│ [← Volver]                                               │
│                                                          │
│ "Editar usuario: Juan Pérez"                             │
│                                                          │
│ ═══════════════════════════════════════════════════════ │
│ INFORMACIÓN PERSONAL (Editables)                         │
│ ═══════════════════════════════════════════════════════ │
│                                                          │
│ Correo electrónico (no editable)  │ Nombres *            │
│ juan@seek.com                     │ [Juan            ]   │
│                                                          │
│ Apellidos *                       │ Número de documento * │
│ [Pérez          ]                 │ [12345678        ]   │
│                                                          │
│ Puesto *                          │ Celular              │
│ [Developer      ]                 │ [+5199999999     ]   │
│                                                          │
│ Avatar                                                   │
│ [Foto 150x150] [Cambiar] [Quitar]                        │
│                                                          │
│ ═══════════════════════════════════════════════════════ │
│ INFORMACIÓN DE TRABAJO (Editables)                       │
│ ═══════════════════════════════════════════════════════ │
│                                                          │
│ Equipo *                          │ Area *               │
│ [Dropdown ▼]                      │ [Dropdown ▼]         │
│                                                          │
│ Fecha de ingreso *                │                      │
│ [DD/MM/YYYY]                      │                      │
│                                                          │
│ ═══════════════════════════════════════════════════════ │
│ PERMISOS Y ESTADO (Editables)                            │
│ ═══════════════════════════════════════════════════════ │
│                                                          │
│ Activo                    ☑ Sí   ☐ No                   │
│ Staff                     ☑ Sí   ☐ No                   │
│ Super usuario             ☐ Sí   ☑ No                   │
│                                                          │
│ Grupos (multi-select)                                   │
│ ☑ Administradores  ☑ Seekers  ☐ Gestores               │
│ ☐ Otros                                                 │
│                                                          │
│ ═══════════════════════════════════════════════════════ │
│ HISTÓRICO (Solo lectura)                                │
│ ═══════════════════════════════════════════════════════ │
│                                                          │
│ Estado anterior          │ Fecha desactivación           │
│ Activo (mostrando)       │ — (no desactivado)            │
│                                                          │
│ ═══════════════════════════════════════════════════════ │
│ DATOS DE CLIENTE (Si aplica)                            │
│ ═══════════════════════════════════════════════════════ │
│                                                          │
│ Razón comercial           │ Razón social                │
│ [              ]          │ [              ]            │
│                                                          │
│ RUC                       │ Segmentación *              │
│ [              ]          │ [Dropdown ▼]                │
│                                                          │
│ Categoría de usuario *    │ Sector                      │
│ [Dropdown ▼]              │ [Dropdown ▼]                │
│                                                          │
│ ═══════════════════════════════════════════════════════ │
│ PROYECTOS ASOCIADOS                                     │
│                                                          │
│ [Proyecto A] [Proyecto B] [+ Agregar]                   │
│                                                          │
│ ═══════════════════════════════════════════════════════ │
│ USUARIOS ASOCIADOS POR PROYECTO                         │
│                                                          │
│ Proyecto A: [Usuario X] [Usuario Y] [+ Agregar]        │
│ Proyecto B: [Usuario Z] [+ Agregar]                    │
│                                                          │
│ [Guardar]  [Cancelar]                                   │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## Detalles de campos

### Sección: Información Personal

| Campo | Tipo | Editable | Obligatorio | Notas |
|-------|------|----------|-------------|-------|
| Correo electrónico | Text | No | — | Se muestra como referencia |
| Nombres | Text | Sí | ✓ | Validar no vacío |
| Apellidos | Text | Sí | ✓ | Validar no vacío |
| Número de documento | Text | Sí | ✓ | Validar formato (sin guiones) |
| Puesto | Text/Dropdown | Sí | ✓ | Puede ser dropdown con opciones predef |
| Celular | Text | Sí | No | Formato: +5199999999 |
| Avatar | File | Sí | No | JPG/PNG, máx 2MB, 150x150px |

### Sección: Información de Trabajo

| Campo | Tipo | Editable | Obligatorio | Notas |
|-------|------|----------|-------------|-------|
| Equipo | Dropdown | Sí | ✓ | Relacionado a tabla Equipos |
| Area | Dropdown | Sí | ✓ | Relacionado a tabla Areas |
| Fecha de ingreso | Date | Sí | ✓ | Formato DD/MM/YYYY |

### Sección: Permisos y Estado

| Campo | Tipo | Editable | Valores | Notas |
|-------|------|----------|--------|-------|
| Activo | Radio/Checkbox | Sí | Sí/No | Soft delete; inactivo = no accede |
| Staff | Radio/Checkbox | Sí | Sí/No | Usuario tiene privilegios elevados |
| Super usuario | Radio/Checkbox | Sí | Sí/No | Admin global (cuidad con permisos) |
| Grupos | Multi-select | Sí | Administradores, Seekers, Gestores, etc | Múltiples grupos permitidos |

### Sección: Histórico (Solo lectura)

| Campo | Tipo | Editable | Notas |
|-------|------|----------|-------|
| Registrado | DateTime | No | Fecha y hora de creación del usuario |
| Actualizado | DateTime | No | Última fecha de modificación |
| Estado anterior | Text | No | Muestra estado previo (Activo/Inactivo) |
| Fecha desactivación | DateTime | No | Si nunca fue desactivado: "—" o vacío |

### Sección: Datos de Cliente (Condicional)

Solo mostrar si el usuario tiene rol de "Cliente" o si es necesario para categorización.

| Campo | Tipo | Editable | Obligatorio (si aplica) |
|-------|------|----------|---------|
| Razón comercial | Text | Sí | No |
| Razón social | Text | Sí | No |
| RUC | Text | Sí | No |
| Segmentación | Dropdown | Sí | ✓ |
| Categoría de usuario | Dropdown | Sí | ✓ |
| Sector | Dropdown | Sí | No |

### Sección: Proyectos Asociados

- **Componente:** Chips/badges de proyectos
- **Editable:** Sí
- **Acción:** [+ Agregar] → Modal/Dropdown para agregar más proyectos
- **Acción:** [X] en cada chip → Remover proyecto

### Sección: Usuarios Asociados por Proyecto

- **Componente:** Por cada proyecto, lista de usuarios
- **Editable:** Sí
- **Formato:** "Proyecto A: [Usuario X] [Usuario Y]"
- **Acción:** [+ Agregar] → Modal para agregar usuario a ese proyecto

---

## Comportamiento

### Default (formulario cargado)
- Campos rellenados con datos actuales
- Campos no editables en gris
- Validaciones al cambiar valores
- Botón "Guardar" habilitado si hay cambios

### Guardando
- Spinner en botón Guardar
- Campos deshabilitados
- POST/PUT a `/users/:id`

### Éxito
- Toast: "Usuario actualizado"
- Redirecciona a S-03-USUARIOS-LISTA

### Error
- Alert rojo con mensaje de error
- Mantiene datos en formulario

---

## Validaciones

- **Nombres, Apellidos, Puesto:** No vacío, máx 100 caracteres
- **Documento:** Números solo, 6-20 dígitos
- **Celular:** Formato telefónico válido
- **Email:** Ya existe en sistema, no se puede cambiar (mostrando)
- **Fecha ingreso:** No puede ser futura
- **Avatar:** JPG/PNG máx 2MB

---

## Acciones disponibles

| Acción | Componente | Resultado |
| ------ | ---------- | --------- |
| Editar campo | Input/Dropdown | Validación en tiempo real |
| Cambiar Avatar | File input | Preview antes de guardar |
| [Quitar] Avatar | Botón | Elimina avatar actual |
| [+ Agregar] Proyecto | Botón | Modal/Dropdown para seleccionar proyecto |
| [X] en chip Proyecto | Botón | Remueve proyecto |
| [+ Agregar] Usuario | Botón | Modal para agregar usuario a proyecto |
| [Guardar] | Button | PUT /users/:id → S-03-USUARIOS-LISTA |
| [Cancelar] | Button | Regresa a S-03-USUARIOS-LISTA (con warning si hay cambios) |
| [← Volver] | Link | Regresa a S-03-USUARIOS-LISTA |

---

## Responsive

- Mobile: Secciones apiladas, campos stacked, ancho 100%
- Desktop: Dos columnas donde sea posible

---

**Relacionado:** Flujo F-09 (Gestión usuarios), S-03-USUARIO-CREAR
