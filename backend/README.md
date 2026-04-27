# Backend

Completar este directorio con el código del servidor según el stack definido en `.ai/context.md`.

---

## Stack sugerido

Definir en `.ai/context.md` antes de inicializar. Opciones comunes:

| Stack | Comando de inicio |
|-------|-------------------|
| Node.js + Express | `npm init -y` |
| Node.js + Fastify | `npm init -y` |
| Python + FastAPI | `uv init` |
| Python + Django | `django-admin startproject .` |

---

## Estructura esperada (Node.js/Express — ejemplo)

```
backend/
├── src/
│   ├── routes/          ← endpoints por recurso
│   ├── services/        ← lógica de negocio
│   ├── data/            ← acceso a base de datos (queries, ORM)
│   ├── middlewares/     ← auth, validación, error handling
│   └── index.js         ← entry point
├── tests/
│   ├── unit/            ← tests por función/servicio
│   └── integration/     ← tests por endpoint
├── .env.example         ← variables de entorno requeridas
├── package.json
└── README.md
```

---

## Variables de entorno

Copiar `.env.example` a `.env` y completar antes de correr el proyecto.

```bash
cp .env.example .env
```

---

## Comandos

```bash
# Instalar dependencias
npm install

# Desarrollo con hot-reload
npm run dev

# Producción
npm start

# Tests
npm test

# Tests con coverage
npm run test:coverage
```

---

## Convenciones

Definir en `CLAUDE.md` del proyecto:

- Idioma del código: [pendiente]
- Estilo de nombres: [pendiente]
- Estrategia de testing: [pendiente]
- ORM / query builder: [pendiente]
