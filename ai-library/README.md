# AI Library — Diego Jaime

Librería reutilizable de agentes, skills y templates de contexto para proyectos con Claude Code.

## Estructura

```
ai-library/
├── agents/                   ← definiciones de agentes por rol
│   ├── pm-digital.md         ← Product Manager de productos digitales
│   ├── backend-dev.md        ← Backend Developer (APIs, lógica de negocio)
│   ├── frontend-dev.md       ← Frontend Developer (UI, componentes, estado)
│   ├── ux-designer.md        ← UX/UI Designer (flujos, pantallas, consistencia)
│   ├── db-architect.md       ← Database Architect (esquema, migraciones, queries)
│   └── web-builder.md        ← Creador de páginas web (HTML/CSS/JS)
│   (los skills viven en .claude/commands/ del proyecto)
└── context-templates/        ← plantillas de .ai/context.md por tipo de proyecto
    ├── landing-page.md       ← para landing pages estáticas
    └── producto-digital.md   ← para productos digitales completos
```

## Cómo usar en un proyecto nuevo

### 1. Copiá el template de contexto
```bash
cp ai-library/context-templates/landing-page.md mi-proyecto/.ai/context.md
```
Completá el archivo con los datos del proyecto.

### 2. Copiá los agentes que necesites
```bash
cp ai-library/agents/pm-digital.md mi-proyecto/agents/pm-digital.md
cp ai-library/agents/web-builder.md mi-proyecto/agents/web-builder.md
```

### 3. Creá el CLAUDE.md del proyecto
```bash
# En la raíz del proyecto
touch mi-proyecto/CLAUDE.md
```
Agregá la instrucción de leer `.ai/context.md` al inicio de cada sesión.

## Cómo invocar un agente
```
Actuá como el agente definido en agents/pm-digital.md y [tarea].
```

## Cómo usar un skill
```
/pm-story quiero agregar un sistema de turnos online
```
