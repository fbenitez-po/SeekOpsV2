# S-00-LOGIN — Autenticación

> Pantalla de entrada a la plataforma. Todos los roles (Seeker, Gestor, Admin) inician sesión con el mismo formulario.

**Ruta:** `/login` (redirige a `/home` según rol después de autenticarse)  
**Usuario:** Cualquiera sin sesión activa

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
│  "Ingresa tus credenciales"                  │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │ Correo electrónico                     │  │
│  │ [                              ]       │  │
│  │ correo@ejemplo.com                     │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │ Contraseña                             │  │
│  │ [                              ] [👁]  │  │
│  │                                        │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ☐ Mostrar contraseña                        │
│                                              │
│  [       INGRESAR       ]                    │
│                                              │
│  ¿Olvidaste tu contraseña?                   │
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
- **Logo** — Centrado en la parte superior (32×32px o según brand guide)
- **Título** — "Seekops" + "Ingresa tus credenciales" (typography: h2 + subtitle)
- **Campo Correo** — Input type="email", placeholder="correo@ejemplo.com", estado normal (border gris claro)
- **Campo Contraseña** — Input type="password", placeholder="••••••••", botón toggle "Mostrar contraseña" (ícono ojo)
- **Checkbox** — "Mostrar contraseña" (unchecked por defecto)
- **Botón Ingresar** — Primary button, deshabilitado hasta que ambos campos tengan contenido
- **Link Recuperar contraseña** — Texto pequeño, color secondary, centrado debajo del botón
- **Footer** — Copyright text, color grey-500, tamaño xs

**Validación en tiempo real:**
- Correo: valida formato email (regex básico) mientras digita
- Contraseña: no valida hasta submit
- Correo vacío + Contraseña vacío = Botón deshabilitado
- Correo válido + Contraseña (cualquier contenido) = Botón habilitado

**Focus/Keyboard:**
- Tab order: Correo → Contraseña → Mostrar contraseña → Ingresar → Link recuperar
- Enter en cualquier campo = submit del formulario

---

### Cargando (después de hacer clic en "Ingresar")

**Estado visual:**
- **Botón Ingresar** — Spinner spinning en lugar del texto, cursor default, deshabilitado
- **Campos de entrada** — Deshabilitados (readonly visual, opacity 0.6)
- **Mensaje** — (opcional) "Validando credenciales..." en texto pequeño debajo del botón, color secondary

**Comportamiento:**
- No permitir más clics en el botón
- No permitir cambiar valores en los campos

---

### Error (credenciales inválidas)

**Componentes:**
- **Alert/Banner** — Aparece debajo del título
  - Color: destructive (rojo)
  - Texto: "Credenciales inválidas. Verifica correo y contraseña."
  - Ícono: X o warning
  - Animación: fade-in suave

- **Campos de entrada:**
  - Border color: destructive (rojo)
  - Error text debajo de cada campo (si aplica)

- **Botón Ingresar** — Vuelve a estado "habilitado", desaparece spinner

**Tiempo de desaparición:**
- Alert desaparece cuando usuario modifica cualquiera de los campos
- O se puede cerrar con X en el alert

---

### Validación de campos

**Correo:**
- Vacío: sin validación visible
- Formato inválido: "Formato de correo no válido" (cuando pierde focus)
- Válido: border verde o checkmark pequeño (opcional)

**Contraseña:**
- Vacío: sin validación visible
- Tiene contenido: sin validación visual (no hace falta)
- Menos de 6 caracteres: (posterior a submit si aplica backend)

---

## Acciones disponibles

| Acción | Componente | Resultado |
| ------ | ---------- | --------- |
| Ingresar texto correo | Input Correo | Valida formato en tiempo real, habilita/deshabilita botón |
| Ingresar texto contraseña | Input Contraseña | Habilita botón si ambos campos tienen contenido |
| Clic en "Mostrar contraseña" | Checkbox | Cambia input type a "text", ícono cambia a "ojo cerrado" |
| Clic en "INGRESAR" | Primary Button | Envía POST /auth/login {correo, contraseña} y pasa a estado Cargando |
| Login exitoso | Backend response 200 | Token JWT guardado en localStorage, redirige a `/home` según rol |
| Login fallido | Backend response 401 | Muestra estado Error con alert destructive |
| Clic en "¿Olvidaste tu contraseña?" | Link | Navega a `/recuperar-contraseña` (flujo F-01-ALT) |
| Enter en cualquier campo | Keyboard | Hace submit del formulario (si validación local OK) |
| Tab desde contraseña | Keyboard | Avanza a checkbox "Mostrar contraseña" |

---

## Responsive

### Mobile (< 640px)

- **Layout:** Mismo, pero con padding aumentado (16px lateral)
- **Logo:** 24×24px
- **Título:** Tamaño lg en lugar de h2
- **Campos:** Ancho 100%, altura aumentada a 44px (touch target)
- **Botón:** Ancho 100%, altura 44px, font-size 16px (evita zoom en iOS)
- **Footer:** Tamaño xxs, línea altura reducida

### Tablet (640px - 1024px)

- **Layout:** Centrado con max-width 400px
- **Campos:** Ancho 100% (dentro del max-width)
- **Resto:** Igual a desktop

### Desktop (> 1024px)

- **Layout:** Centrado vertical en pantalla, max-width 400px
- **Campos:** Ancho 100% (dentro del max-width)
- **Espaciado:** Más generoso entre componentes

---

## Accessibility

- **Labels asociados:** Cada input tiene `<label>` vinculado con `for` attribute (aunque sea invisible, Screen reader lo lee)
- **ARIA:** `aria-invalid="true"` cuando hay error, `aria-describedby` vinculado a mensaje de error
- **Contraste:** Texto en botón cumple WCAG AA (4.5:1 mínimo)
- **Focus visible:** Ring de 2px en color primary cuando focus
- **Color no es única indicación:** Errores también tienen ícono + texto

---

## Interacciones especiales

**Password visibility toggle:**
- El ícono de ojo es clickeable (no solo el checkbox)
- Mostrar/ocultar es inmediato (sin transición)
- Mantiene el cursor en la misma posición si el usuario estaba escribiendo

**Link "¿Olvidaste tu contraseña?":**
- Hover: subrayado + color más saturado
- Color: secondary (azul según brand)
- No redirige si hay validación fallida en pantalla (usuario debe limpiar alert primero)

---

## Fuera de alcance

- **Registro de usuario** — Solo login, no hay opción "Crear cuenta" (los admins crean usuarios)
- **Social login** (Google, GitHub, etc.) — Post-MVP
- **Two-factor authentication** — Post-MVP
- **Sesión persistente ("Recuérdame")** — No incluir, JWT con timeout definido en backend
- **Validación de correo en tiempo real con backend** — Solo validación local (formato)
- **Captcha** — Post-MVP si es necesario por spam
- **Dark mode** — Usar colores del design system (aplicado por CSS, no por pantalla)

---

**Relacionado:** Flujo F-01 (Seeker), F-05 (Gestor), F-08 (Admin)
