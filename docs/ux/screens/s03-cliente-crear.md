# S-03-CLIENTE-CREAR — Crear cliente

> Formulario para crear un nuevo cliente. Incluye información comercial, contacto y estado.

**Ruta:** `/admin/clientes/crear`  
**Usuario:** Admin autenticado

---

## Detalles de campos

| Campo | Tipo | Requerido | Validación |
|-------|------|-----------|-----------|
| Nombre | Text | ✓ | No vacío, máx 100 |
| Razón social | Text | No | Máx 150 |
| Razón comercial | Text | No | Máx 150 |
| RUC | Text | ✓ | Formato numérico, 11-14 dígitos |
| Nombre contacto | Text | No | Máx 100 |
| Email contacto | Email | No | Validar formato email |
| Teléfono | Text | No | Formato telefónico |
| Dirección | Text | No | Máx 200 |
| Categoría de usuario | Dropdown | ✓ | Tipos de categoría |
| Segmentación | Dropdown | ✓ | Enterprise, Mid Market, SMB, etc |
| Sector | Dropdown | No | Industria/sector |
| Activo | Radio/Checkbox | ✓ | Sí/No, por default Sí |

---

## Layout

```
┌─────────────────────────────────────┐
│ [← Volver]                          │
│ "Crear cliente"                     │
│                                     │
│ INFORMACIÓN COMERCIAL               │
│ ┌───────────────┬──────────────┐   │
│ │ Nombre *      │ Razón social │   │
│ │ [         ]   │ [        ]   │   │
│ └───────────────┴──────────────┘   │
│                                     │
│ Razón comercial   RUC *             │
│ [              ]  [          ]      │
│                                     │
│ CONTACTO                            │
│ ┌───────────────┬──────────────┐   │
│ │ Nombre        │ Teléfono     │   │
│ │ [         ]   │ [        ]   │   │
│ └───────────────┴──────────────┘   │
│                                     │
│ Email              Dirección        │
│ [             ]    [           ]    │
│                                     │
│ ESTADO                              │
│ Activo ☑ Sí  ☐ No                  │
│                                     │
│ [Crear cliente]  [Cancelar]         │
│                                     │
└─────────────────────────────────────┘
```

---

## Estados

**Default (formulario vacío):**
- Campos vacíos excepto "Activo" = Sí (por default)
- Botón "Crear cliente" deshabilitado hasta completar Nombre y RUC

**Guardando:**
- Spinner en botón
- Campos deshabilitados

**Éxito:**
- POST /clients → Toast "Cliente creado"
- Redirecciona a S-03-CLIENTES-LISTA

**Error:**
- Alert rojo con mensaje
- Mantiene datos en formulario

---

## Acciones

| Acción | Resultado |
| ------ | --------- |
| Editar campo | Validación en tiempo real |
| Guardar | POST /clients → S-03-CLIENTES-LISTA |
| Cancelar | Regresa a S-03-CLIENTES-LISTA |

---

**Relacionado:** Flujo F-10 (Gestión clientes), S-03-CLIENTE-EDITAR
