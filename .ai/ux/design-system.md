# Design System — Seekops

Basado en **shadcn/ui** — componentes customizables, Tailwind CSS, React.

---

## 🎨 Paleta de Colores

### Tema: Light (default)

**Primarios:**
- `primary` — Azul principal (para CTAs, acciones importantes)
- `secondary` — Gris/neutro (para acciones secundarias)
- `destructive` — Rojo (para rechazos, eliminaciones, errores)
- `success` — Verde (para aprobaciones, estados positivos)
- `warning` — Ámbar (para observaciones, advertencias)

**Neutrales:**
- `background` — Blanco/gris muy claro (fondo de página)
- `foreground` — Negro/gris muy oscuro (texto)
- `muted` — Gris claro (textos secundarios, placeholders)
- `muted-foreground` — Gris medio (etiquetas, hints)
- `border` — Gris claro (bordes de inputs, cards)
- `input` — Blanco/gris claro (fondo de inputs)
- `card` — Blanco (fondo de cards/modales)

**Modo Oscuro:** Soportado (colores invertidos automáticamente)

---

## 📝 Tipografía

**Familia:** Inter (sin serif) o sistema por defecto de shadcn/ui

**Escala de tamaños:**
- `xs` — 12px (helpers, captions)
- `sm` — 14px (labels, small text)
- `base` — 16px (body text, default)
- `lg` — 18px (subheadings)
- `xl` — 20px (section headings)
- `2xl` — 24px (page titles)

**Pesos:**
- Regular (400) — Body text
- Medium (500) — Labels, badges
- Semibold (600) — Headings, buttons
- Bold (700) — Page titles

**Line heights:**
- Tight (1.2) — Headings
- Normal (1.5) — Body text
- Relaxed (1.75) — Inputs, forms

---

## 🔲 Componentes Base

### Button

**Variantes:**
- `default` — Azul primario (acciones principales)
- `secondary` — Gris (acciones alternativas)
- `outline` — Borde + text (acciones terciarias)
- `ghost` — Sin fondo (acciones mínimas, breadcrumbs)
- `destructive` — Rojo (rechazos, eliminar)
- `link` — Azul subrayado (navegación)

**Tamaños:**
- `xs` — Botones muy pequeños (acciones inline)
- `sm` — Botones compactos (mobile-first)
- `default` — Estándar (56px alto, 16px font)
- `lg` — Botones grandes (CTAs principales)
- `icon` — Circulares (solo icono)

**Estados:**
- Normal → Hover (cambio de tonalidad)
- Hover → Focus (ring de color)
- Disabled (opacidad 50%, cursor not-allowed)
- Loading (spinner dentro del botón)

### Input

**Estilos:**
- Borde gris claro (1px)
- Padding: 12px 16px
- Radius: 6px (rounded-md)
- Focus: ring azul primario
- Placeholder: gris muted

**Variantes:**
- Text, Email, Password, Number, Textarea
- With icon (icon a la izquierda o derecha)
- With label (label arriba)
- With error (borde rojo, mensaje error debajo)
- Disabled (fondo gris, cursor not-allowed)

### Select / Dropdown

**Estructura:**
- Trigger button (muestra valor seleccionado)
- Dropdown list (opciones)
- Searchable (opción para filtrar)

**Estilos:**
- Same border/focus como input
- Opciones hover: fondo gris claro
- Opción selected: azul primario + checkmark

### Modal / Dialog

**Estructura:**
- Overlay oscuro (30% opacidad, fondo page oscurece)
- Card centrado (max-width: 500px)
- Header (título + botón cerrar X)
- Body (contenido)
- Footer (botones: Cancelar, Aceptar)

**Estilos:**
- Border: 1px gris claro
- Radius: 8px
- Shadow: sombra suave
- Animación: fade-in 200ms

### Table

**Estructura:**
```
Table
├── TableHeader (TableRow + TableHead)
├── TableBody (TableRow + TableCell)
└── TableFooter (opcional)
```

**Estilos:**
- Header: fondo gris muy claro, font semibold
- Rows: borde bottom gris claro, hover: fondo gris más claro
- Cell padding: 12px 16px
- Responsive: scroll horizontal en mobile

**Acciones por fila:**
- Dropdown menu (3 puntos verticales) con opciones: Editar, Eliminar, Más acciones
- O botones directos si solo hay 1-2 acciones

### Card

**Estructura:**
- Border: 1px gris claro
- Padding: 20px
- Radius: 8px
- Background: blanco/card color

**Variantes:**
- Default (información)
- With header (título + subtitle)
- Elevated (shadow más fuerte)

### Badge / Label

**Tamaños:**
- `sm` — 12px font, padding 4px 8px
- `default` — 14px font, padding 6px 12px

**Variantes (estados de horas):**
- `Pendiente` — Gris (secondary)
- `Aprobado` — Verde (success)
- `Observado` — Ámbar (warning)
- `Rechazado` — Rojo (destructive)

### Alert / Toast

**Para notificaciones:**
- Error (destructive): icono rojo + mensaje
- Success (success): icono verde + mensaje
- Warning (warning): icono ámbar + mensaje
- Info (info): icono azul + mensaje

**Duración automática:** 5 segundos (dismissible)

---

## 📐 Espaciado y Grid

**Sistema:** 4px grid

**Spacing scale:**
- `2` — 8px (micro spacing)
- `3` — 12px (small)
- `4` — 16px (base, default)
- `6` — 24px (medium)
- `8` — 32px (large)
- `12` — 48px (xlarge)

**Container widths:**
- Mobile: 100% (full screen - padding)
- Tablet: 100% (full screen - padding)
- Desktop: 1024px max-width, centered

**Breakpoints (Tailwind):**
- `sm` — 640px
- `md` — 768px
- `lg` — 1024px
- `xl` — 1280px

---

## 🎭 Estados Visuales

### Inputs

| Estado | Estilo |
|--------|--------|
| Default | Borde gris claro, fondo blanco |
| Focus | Borde azul primario, ring azul (2px) |
| Filled | Fondo ligeramente gris |
| Error | Borde rojo, icono error, mensaje error en rojo |
| Disabled | Fondo gris, cursor not-allowed, opacidad 50% |
| Loading | Spinner dentro, input deshabilitado |

### Buttons

| Estado | Estilo |
|--------|--------|
| Default | Color base + shadow sutil |
| Hover | Tonalidad más oscura |
| Focus | Ring azul (2px) |
| Active | Tonalidad aún más oscura |
| Disabled | Opacidad 50%, cursor not-allowed |
| Loading | Spinner + text deshabilitado |

### Tables / Lists

| Estado | Estilo |
|--------|--------|
| Row default | Borde bottom gris claro |
| Row hover | Fondo gris muy claro |
| Row selected | Checkbox checked + fondo azul muy claro |
| Cell focus | Ring azul si es editable |

---

## 🏷️ Iconografía

**Librería:** Lucide Icons (integrada en shadcn/ui)

**Tamaños estándar:**
- `16` — 16px (inline con texto)
- `20` — 20px (buttons, inputs)
- `24` — 24px (headers, large buttons)
- `32` — 32px (page titles, hero sections)

**Colores:**
- Inherit (mismo color que elemento padre)
- Muted (gris claro, para acciones secundarias)
- Destructive (rojo, para errores/peligro)
- Success (verde, para confirmación)

**Ejemplos para Seekops:**
- Carga de horas: `Clock`, `Plus`, `FileText`
- Aprobación: `Check`, `X`, `AlertCircle`
- Gestión: `Users`, `Briefcase`, `Settings`
- Estados: `Clock` (pending), `CheckCircle` (approved), `AlertCircle` (observed), `XCircle` (rejected)

---

## 📱 Responsive Design

**Mobile-first approach:**

| Viewport | Breakpoint | Layout |
|----------|-----------|--------|
| Mobile | 320-640px | 1 columna, full width, stack vertical |
| Tablet | 641-1024px | 2 columnas cuando aplique |
| Desktop | 1025px+ | Multi-columna, max-width 1024px |

**Tablas en mobile:**
- Horizontal scroll con width mínimo de 600px
- O conversión a cards stacked (si es viable)

---

## 🔗 Instalación

```bash
# Agregar componentes necesarios a React project
pnpm dlx shadcn@latest add button input select dialog table badge alert

# O instalar manualmente en el proyecto
npm install shadcn-ui @radix-ui/react-* lucide-react
```

---

## ✅ Componentes para Seekops

**Definitivamente necesitamos:**
- `Button` — Acciones (Guardar, Aprobar, Rechazar, etc.)
- `Input` — Formularios (Semana, Horas, Comentario, etc.)
- `Select/Dropdown` — Proyecto, Categoría, Estado, Rol
- `Table` — Listado de horas, usuarios, proyectos
- `Dialog/Modal` — Confirmaciones, detalles, formularios
- `Form` — Estructuración de formularios con validación
- `Badge` — Estados (Pendiente, Aprobado, Observado, Rechazado)
- `Alert` — Mensajes de error, éxito, avisos
- `Card` — Contenedores de información
- `Tabs` — Si hay múltiples vistas (e.g., Mis horas / Observadas)

**Opcionales (post-MVP):**
- `Pagination` — Si listados son muy largos
- `DataTable` — Con sorting/filtering avanzado
- `Toast` — Notificaciones en esquina (vs. modales)

---

## 🎯 Guía Rápida para Screens

Al especificar pantallas, usar:
- **Button:** `<Button variant="default" size="default">Guardar</Button>`
- **Input:** `<Input placeholder="Ingresa horas" type="number" />`
- **Select:** `<Select><SelectItem value="proyecto-1">Proyecto A</SelectItem></Select>`
- **Badge:** `<Badge variant="secondary">Pendiente</Badge>`
- **Table:** Para listados con múltiples registros
- **Dialog:** Para confirmaciones o detalles

---

## 📚 Referencias

- **shadcn/ui docs:** https://ui.shadcn.com/
- **Tailwind CSS:** https://tailwindcss.com/
- **Lucide Icons:** https://lucide.dev/
- **Radix UI primitives:** https://www.radix-ui.com/

