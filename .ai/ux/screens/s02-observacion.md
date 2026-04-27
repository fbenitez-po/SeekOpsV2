# S-02-OBSERVACION — Modal de observación

> Modal/Dialog para que el gestor ingrese motivo de observación.

**Componentes:**
- Título: "¿Por qué observas esta carga?"
- Opciones predefinidas: "Falta documentación", "Revisar cantidad", "Verificar proyecto", etc.
- Textarea para detalles adicionales
- Botones: Guardar | Cancelar

**Acciones:** Guardar → PUT /time-entries/:id/observe → Email a seeker
