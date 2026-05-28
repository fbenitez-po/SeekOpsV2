# S-00-RECUPERAR-CONTRASEÑA — Recuperación de contraseña

> Pantalla para que usuarios restablezcan su contraseña olvidada. Flujo de dos pasos: verificación de correo y restablecimiento.

**Ruta:** `/recuperar-contraseña`  
**Usuario:** Cualquiera que llegue desde el login o que acceda directamente

---

## Componentes y layout

```
┌──────────────────────────────────────────────┐
│                                              │
│         Logo + Nombre de aplicación          │
│                "Seekops"                     │
│                                              │
├──────────────────────────────────────────────┤
│                                              │
│  "Recupera tu contraseña"                    │
│  "Ingresa tu correo para recibir un enlace"  │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │ Correo electrónico                     │  │
│  │ [                              ]       │  │
│  │ nombre@ejemplo.com                     │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  [    ENVIAR ENLACE DE RECUPERACIÓN    ]     │
│                                              │
│  ← Volver a login                            │
│                                              │
│  ────────────────────────────────────────    │
│  © 2026 Seek Global. Todos los derechos     │
│                                              │
└──────────────────────────────────────────────┘
```

---

## Estados

### Default (formulario vacío)

**Componentes presentes:**
- **Logo** — Igual a S-00-LOGIN (32×32px)
- **Título** — "Recupera tu contraseña"
- **Subtítulo** — "Ingresa tu correo para recibir un enlace de restablecimiento"
- **Campo Correo** — Input type="email", placeholder="nombre@ejemplo.com", estado normal
- **Botón Enviar** — "ENVIAR ENLACE DE RECUPERACIÓN", deshabilitado hasta que haya un correo válido
- **Link Volver** — "← Volver a login", color secondary, pequeño, arriba del footer

**Validación:**
- Correo vacío = Botón deshabilitado
- Correo inválido = Botón deshabilitado
- Correo válido = Botón habilitado

---

### Cargando (después de hacer clic en "Enviar enlace")

**Estado visual:**
- **Botón Enviar** — Spinner en lugar del texto, deshabilitado
- **Campo Correo** — Deshabilitado (opacity 0.6, readonly visual)
- **Mensaje** — (opcional) "Enviando..." debajo del botón

**Comportamiento:**
- No permitir más clics
- No permitir cambiar el correo

---

### Éxito (enlace enviado)

**Componentes:**
- **Alert/Banner** — Aparece en la parte superior
  - Color: success (verde) o neutral
  - Ícono: checkmark o mail
  - Texto: "Verifica tu correo. Hemos enviado un enlace a [correo@ejemplo.com]"
  - Animación: fade-in suave

- **Formulario** — Se deshabilita o se oculta (mostrar solo el alert)

- **Instrucciones** — "El enlace expira en 24 horas. Si no recibiste el correo, revisa tu bandeja de spam."

- **Link "Enviar otro correo"** — Para intentar nuevamente con otro correo (vuelve al formulario vacío)

- **Link Volver a login** — Para regresar al login

**Duración:**
- El alert permanece visible
- Opcionalmente, redirigir a login después de 3-5 segundos

---

### Error (correo no encontrado o problema)

**Componentes:**
- **Alert/Banner** — Aparece debajo del título
  - Color: destructive (rojo)
  - Ícono: X o alert
  - Texto: "No encontramos una cuenta con ese correo" O "Hubo un error al enviar. Intenta de nuevo."

- **Campo Correo** — Border color destructive (rojo)

- **Botón Enviar** — Vuelve a estado "habilitado"

**Tiempo de desaparición:**
- Alert desaparece cuando usuario modifica el correo
- O se puede cerrar manualmente

---

## Acciones disponibles

| Acción | Componente | Resultado |
| ------ | ---------- | --------- |
| Ingresar texto correo | Input Correo | Valida formato en tiempo real, habilita/deshabilita botón |
| Clic en "ENVIAR ENLACE" | Primary Button | Envía POST /auth/forgot-password {correo} → estado Cargando |
| Envío exitoso | Backend response 200 | Muestra estado Éxito + alert success |
| Envío fallido | Backend response 400/404 | Muestra estado Error con alert destructive |
| Clic en "Enviar otro correo" | Link (en estado Éxito) | Vuelve al formulario vacío, limpia campo |
| Clic en "Volver a login" | Link | Navega a `/login` |
| Enter en campo correo | Keyboard | Submit del formulario (si validación OK) |

---

## Responsive

### Mobile (< 640px)

- **Layout:** Mismo, pero con padding aumentado (16px lateral)
- **Logo:** 24×24px
- **Campos:** Ancho 100%, altura 44px (touch target)
- **Botón:** Ancho 100%, altura 44px, font-size 16px
- **Texto:** Ajustado para no exceder ancho

### Tablet / Desktop

- **Layout:** Centrado con max-width 400px
- **Resto:** Igual a desktop

---

## Accessibility

- **Labels asociados:** Label vinculada con `for` attribute
- **ARIA:** `aria-invalid="true"` cuando hay error, `aria-describedby` vinculado a mensaje
- **Focus visible:** Ring de 2px visible
- **Color no es única indicación:** Errores tienen ícono + texto

---

## Interacciones especiales

**Redireccionamiento post-envío:**
- Opción A: Mostrar alert success y esperar a que usuario haga clic en "Volver a login"
- Opción B: Auto-redirigir a login después de 5 segundos (con countdown visual opcional)

**Seguridad:**
- No revelar si el correo existe en la BD (mostrar "Verifica tu correo" incluso si no existe)
- Prevenir enumeration de usuarios

---

## Fuera de alcance

- **Verificación de correo por código OTP** — Post-MVP (por ahora, enlace en email)
- **Página de restablecimiento** (S-00-NUEVA-CONTRASEÑA) — Es otra pantalla, se abre desde enlace en email
- **Historial de intentos de recuperación** — Post-MVP
- **Bloqueo después de N intentos** — Backend puede hacerlo, pero no mostrar en UI

---

**Relacionado:** Flujo F-01-ALT (Seeker/Gestor/Admin)
