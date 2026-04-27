# Pendientes — Decisiones bloqueantes

> Decidir antes de avanzar a API + Código.
> Las decisiones aquí bloquean desarrollo porque afectan API, DB, flujos o validaciones.

---

## Abiertos

| ID | Tema | Bloquea | Estado |
|---|---|---|---|

---

## Cerrados

| ID | Tema | Decisión | Fecha |
|---|---|---|---|
| P-001 | Período para cargar horas retroactivas | Sin límite máximo — puede cargar cualquier semana | 2026-04-23 |
| P-002 | Auditoria de cambios en horas | Sí — se registra quién cambió qué y cuándo | 2026-04-23 |
| P-003 | Sistema de notificaciones | Email automático en eventos clave (aprobación, observación, ajustes) | 2026-04-23 |
| P-004 | ¿Se puede desaprobar horas? | No — aprobación es definitiva. Rechazo es la opción si hay error | 2026-04-23 |
| P-005 | Flujo de aprobación para gestor que carga horas | Se auto-aprueba (porque es el gestor del proyecto) | 2026-04-23 |
| P-006 | Manejo de horas rechazadas | Se visualizan sin opción de editar. Nueva carga requiere crear entrada nueva | 2026-04-23 |
| P-007 | Modelo de asignación usuario-proyecto-rol | Múltiples roles permitidos — un usuario puede ser Seeker en Proyecto A, Gestor en B, o ambos en C | 2026-04-23 |
| P-008 | Integración de email | Requerida para notificaciones — definir SMTP/templates en etapa de código | 2026-04-23 |

---

## Notas

- ✅ Todas las decisiones críticas están cerradas
- El email se implementa en etapa de código (no bloquea desarrollo de lógica)
- Actualizado `context.md` y historias con estas decisiones

---

