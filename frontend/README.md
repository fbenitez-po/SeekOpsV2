# Frontend — Seekops

App web del cliente: React + Vite + shadcn/ui + Tailwind CSS. Consume la API del backend (`/api/v1`).

## Estructura

```
frontend/src/
├── components/   # componentes reutilizables (incluye UI shadcn)
├── pages/        # vistas/pantallas (una por route)
├── services/     # cliente axios y llamadas a la API
├── store/        # estado global
├── lib/          # utilidades
├── App.jsx
├── main.jsx      # entry point
└── index.css     # estilos base + tokens Tailwind
```

## Variables de entorno

Copiar `.env.example` a `.env.local`:

```bash
cp .env.example .env.local
```

- `VITE_API_URL` — URL base de la API. Si no se define, usa `/api/v1` (proxy de Vite en dev).

## Comandos

```bash
npm install      # instalar dependencias
npm run dev      # servidor de desarrollo
npm run build    # build de producción
npm run preview  # preview del build
```

## Convenciones

- **Idioma:** código en inglés; textos de UI en español latino (tuteo). Ver `CLAUDE.md` y `docs/context.md` → "Convenciones".
- **Estilo visual:** debe coincidir exactamente con los previews aprobados en `docs/preview/`. Tokens en `docs/context.md` → "Design System".
