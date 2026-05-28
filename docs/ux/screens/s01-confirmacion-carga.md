# S-01-CONFIRMACION-CARGA — Confirmación de carga

> Pantalla que confirma que las horas fueron registradas exitosamente. Muestra resumen y opciones para volver o cargar más.

**Ruta:** `/confirmacion-carga`  
**Usuario:** Seeker

---

## Componentes

- **Ícono éxito** — Checkmark verde grande
- **Título** — "¡Carga registrada!"
- **Resumen** — Tabla con: Semana, Proyecto, Horas, Extras, Comentario
- **Mensaje** — "Tu carga está pendiente de aprobación. El gestor revisará dentro de 24-48 horas."
- **Botones**:
  - "Volver a mis horas" (primary)
  - "Cargar otra carga" (secondary)

---

## Estados

- **Default**: Muestra confirmación con datos
- **Éxito**: Animación de entrada (fade + slide up)

---

## Acciones

| Acción | Resultado |
| ------ | --------- |
| "Volver a mis horas" | → S-01-HOME-SEEKER |
| "Cargar otra carga" | → S-01-CARGAR-HORAS (vacío) |
