# S-02-RECHAZO — Modal de rechazo

> Modal para que el gestor ingrese motivo de rechazo.

**Componentes:**
- Título: "¿Por qué rechazas esta carga?"
- Opciones: "Proyecto cerrado", "Datos incorrectos", "Fuera de periodo", etc.
- Textarea para detalles
- Botones: Guardar | Cancelar

**Acciones:** Guardar → PUT /time-entries/:id/reject → Email a seeker
