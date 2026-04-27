# Frontend

Completar este directorio con el código del cliente según el stack definido en `.ai/context.md`.

---

## Stack sugerido

Definir en `.ai/context.md` antes de inicializar. Opciones comunes:

| Stack | Comando de inicio |
|-------|-------------------|
| React + Vite | `npm create vite@latest . -- --template react` |
| Next.js | `npx create-next-app@latest .` |
| Vue + Vite | `npm create vite@latest . -- --template vue` |
| HTML vanilla | Sin scaffolding — crear `index.html` directo |

---

## Estructura esperada (React + Vite — ejemplo)

```
frontend/
├── public/              ← assets estáticos (favicon, imágenes)
├── src/
│   ├── components/      ← componentes reutilizables
│   ├── pages/           ← vistas/pantallas (una por route)
│   ├── hooks/           ← custom hooks
│   ├── services/        ← llamadas a la API
│   ├── store/           ← estado global (Zustand, Redux, etc.)
│   └── main.jsx         ← entry point
├── tests/
│   ├── unit/            ← tests de componentes y hooks
│   └── e2e/             ← tests de flujos completos (Playwright/Cypress)
├── .env.example         ← variables de entorno requeridas
├── package.json
└── README.md
```

---

## Variables de entorno

Copiar `.env.example` a `.env.local` y completar antes de correr el proyecto.

```bash
cp .env.example .env.local
```

Variables mínimas:

```
VITE_API_URL=http://localhost:3000
```

---

## Comandos

```bash
# Instalar dependencias
npm install

# Desarrollo
npm run dev

# Build de producción
npm run build

# Preview del build
npm run preview

# Tests unitarios
npm test

# Tests E2E
npm run test:e2e
```

---

## Convenciones

Definir en `CLAUDE.md` del proyecto:

- Idioma del código: [pendiente]
- Estilo de componentes: [pendiente]
- Estrategia de estado global: [pendiente]
- Librería de UI: [pendiente]
