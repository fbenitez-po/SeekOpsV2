# S-03-USUARIO-CREAR — Crear usuario

> Formulario para crear un nuevo usuario. Incluye información personal, trabajo, permisos e inicialización de acceso.

**Ruta:** `/admin/usuarios/crear`  
**Usuario:** Admin autenticado

---

## Detalles de campos

| Campo | Tipo | Requerido | Notas |
|-------|------|-----------|-------|
| Correo electrónico | Email | ✓ | Único, se usa para login |
| Nombres | Text | ✓ | Máx 100 |
| Apellidos | Text | ✓ | Máx 100 |
| Número de documento | Text | ✓ | 6-20 dígitos |
| Puesto | Text/Dropdown | ✓ | Máx 100 |
| Celular | Text | No | Formato telefónico |
| Equipo | Dropdown | ✓ | Relacionado a tabla Equipos |
| Area | Dropdown | ✓ | Relacionado a tabla Areas |
| Fecha de ingreso | Date | ✓ | No puede ser futura |
| Grupos | Multi-select | ✓ | Administradores, Seekers, Gestores, etc |
| Activo | Radio/Checkbox | ✓ | Sí/No, por default Sí |
| Staff | Checkbox | No | Usuario tiene privilegios elevados |
| Super usuario | Checkbox | No | Admin global (cuidado con permisos) |

---

## Layout

```
┌────────────────────────────────────────────┐
│ [← Volver]                                 │
│ "Crear usuario"                            │
│                                            │
│ INFORMACIÓN PERSONAL                       │
│ ┌──────────────┬───────────────────────┐  │
│ │ Correo *     │ Nombres *             │  │
│ │ [email@..]   │ [              ]      │  │
│ └──────────────┴───────────────────────┘  │
│                                            │
│ Apellidos *           Número documento *   │
│ [            ]        [          ]         │
│                                            │
│ Puesto *              Celular              │
│ [            ]        [          ]         │
│                                            │
│ INFORMACIÓN DE TRABAJO                     │
│ ┌──────────────┬────────────────────────┐ │
│ │ Equipo *     │ Area *                 │ │
│ │ [Dropdown ▼] │ [Dropdown ▼]          │ │
│ └──────────────┴────────────────────────┘ │
│                                            │
│ Fecha de ingreso *                         │
│ [DD/MM/YYYY]                               │
│                                            │
│ PERMISOS Y GRUPOS                          │
│ Grupos *                                   │
│ ☑ Administradores  ☑ Seekers              │
│ ☐ Gestores         ☐ Otros                │
│                                            │
│ ☑ Activo                                   │
│ ☐ Staff                                    │
│ ☐ Super usuario                            │
│                                            │
│ [Crear usuario]  [Cancelar]                │
│                                            │
└────────────────────────────────────────────┘
```

---

## Estados

**Default (formulario vacío):**
- Campos vacíos
- "Activo" = Sí (por default)
- Botón "Crear usuario" deshabilitado hasta completar campos requeridos

**Guardando:**
- Spinner en botón
- Campos deshabilitados

**Éxito:**
- POST /users → Toast "Usuario creado"
- Email con contraseña temporal enviado a su correo
- Redirecciona a S-03-USUARIOS-LISTA

**Error:**
- Alert rojo (email duplicado, documento duplicado, etc.)
- Mantiene datos en formulario

---

## Validaciones

- **Email:** Único en sistema, formato válido
- **Documento:** Números solo, 6-20 dígitos
- **Celular:** Formato telefónico
- **Fecha ingreso:** No puede ser futura
- **Grupos:** Al menos uno obligatorio

---

## Acciones

| Acción | Resultado |
| ------ | --------- |
| Completar campos | Habilitación dinámica de botón Crear |
| Crear | POST /users → Email temporal → S-03-USUARIOS-LISTA |
| Cancelar | Regresa a S-03-USUARIOS-LISTA |

---

**Relacionado:** Flujo F-09 (Gestión usuarios), S-03-USUARIO-EDITAR
