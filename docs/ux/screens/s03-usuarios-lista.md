# S-03-USUARIOS-LISTA — Tabla de usuarios

> Lista de todos los usuarios del sistema con filtros y acciones (crear, editar, desactivar).

**Ruta:** `/usuarios`  
**Usuario:** Admin

---

## Componentes

- **Título**: "Usuarios"
- **Botón**: "+ CREAR USUARIO" → S-03-USUARIO-CREAR
- **Tabla**:
  - Nombre | Correo | Rol | Estado | Acciones (Editar | Desactivar)
- **Filtros**: Estado (Activo/Inactivo) | Rol (Seeker/Gestor/Admin)
- **Paginación**

---

## Estados

- **Default**: Tabla con usuarios
- **Vacío**: "No hay usuarios"
- **Cargando**: Skeleton

---

## Acciones

- Crear → S-03-USUARIO-CREAR
- Editar → S-03-USUARIO-EDITAR
- Desactivar → Confirmación modal
