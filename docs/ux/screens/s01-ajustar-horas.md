# S-01-AJUSTAR-HORAS — Ajuste de horas observadas

> Formulario para que seekers corrijan horas cuando reciben observación del gestor.

**Ruta:** `/ajustar-horas/:id`  
**Usuario:** Seeker

---

## Componentes

- **Alert** — Muestra la observación original: "Motivo: [texto del gestor]"
- **Formulario** (similar a carga, pero):
  - Semana: bloqueada (readonly)
  - Proyecto: bloqueado (readonly)
  - Horas: editable
  - Extras: editable
  - Comentario: editable
- **Botones**: Guardar ajuste | Cancelar

---

## Estados

- **Default**: Muestra datos previos + alert con observación
- **Cargando**: Spinner en botón
- **Éxito**: → S-01-CONFIRMACION-AJUSTE

---

## Acciones

| Acción | Resultado |
| ------ | --------- |
| Editar horas/extras/comentario | Valida en tiempo real |
| Guardar ajuste | POST /time-entries/:id/adjust |
| Cancelar | Vuelve a S-01-HOME-SEEKER |
