# SEEK Project Template

Template base para nuevos proyectos con estructura, skills y workflow ya configurados.

## Estructura del template

```
SEEK-Project-Template/
├── .ai/                          # Documentación del proyecto (source of truth)
│   ├── context.md               # Contexto actual del proyecto (leer primero cada sesión)
│   ├── brief.md                 # Brief del producto
│   ├── pendientes.md            # Decisiones bloqueantes
│   ├── stories/                 # Historias de usuario
│   │   ├── README.md            # Índice
│   │   └── epic-01-rol.md       # Template de historias por rol
│   ├── ux/
│   │   ├── flows/               # User flows
│   │   │   └── rol-flows.md     # Template de flows
│   │   └── screens/             # Especificaciones de pantallas
│   │       └── s00-template.md  # Template de screen
│   ├── api/                     # Contratos REST
│   │   ├── contracts-rol.md     # Template de contratos
│   │   └── mocks/               # JSON mocks (crear dentro)
│   └── db/
│       └── schema.md            # Schema PostgreSQL
├── .claude/
│   └── skills/                  # Skills pre-configurados (pm-, be-, fe-, ux-, db-)
├── ai-library/                  # Agentes y templates reutilizables
├── backend/                     # Código backend (vacío, llenar según stack)
├── frontend/                    # Código frontend (vacío, llenar según stack)
├── CLAUDE.md                    # Instrucciones del proyecto
└── README.md                    # Este archivo

```

## Cómo empezar un nuevo proyecto

### 1. Clonar/copiar el template

```bash
cp -r SEEK-Project-Template tu-nuevo-proyecto
cd tu-nuevo-proyecto
git init
```

### 2. Completar el contexto del proyecto

1. Leer y actualizar **`.ai/context.md`** con:
   - Nombre del proyecto
   - Stack elegido
   - Roles y públicos objetivo
   - Estado inicial (siempre comienza en "Brief")

2. Actualizar **`CLAUDE.md`**:
   - Reemplazar `[Nombre del proyecto]`
   - Ajustar el flujo si el proyecto no sigue el estándar

### 3. Empezar con el Brief

Usar `/pm-brief` para estructurar el producto:

```
/pm-brief quiero un MVP que permita [descripción de la idea]
```

Esto llena automáticamente `.ai/brief.md` con los puntos clave.

### 4. Seguir el flujo estándar

Cada paso requiere aprobación explícita antes de avanzar:

```
Brief ✅ → Stories → Flows → Screens → Preview → Pendientes → DB → API → Código
```

Ver `CLAUDE.md` para el detalle de cada paso.

---

## Skills disponibles

| Prefijo | Comando | Uso |
|---------|---------|-----|
| `pm-`   | `/pm-brief` | Estructura el product brief |
|         | `/pm-story` | Escribe historias con Given/When/Then |
|         | `/pm-prioritize` | Prioriza features (Impact/Effort) |
|         | `/pm-risks` | Identifica riesgos y supuestos |
| `ux-`   | `/ux-user-flow` | Define flows completos del usuario |
|         | `/ux-screen-spec` | Especifica pantallas (layout, estados) |
|         | `/ux-design-review` | Revisa implementación vs. diseño |
| `be-`   | `/be-api-contract` | Define contratos REST |
|         | `/be-api-review` | Revisa endpoint en profundidad |
|         | `/be-error-map` | Mapea todos los errores posibles |
| `db-`   | `/db-schema-design` | Diseña schema PostgreSQL |
|         | `/db-migration-write` | Escribe migraciones con up/down |
|         | `/db-query-review` | Revisa queries (índices, N+1, etc.) |
| `fe-`   | `/fe-component-spec` | Especifica componentes React |
|         | `/fe-api-integration` | Planifica consumo de API desde FE |
|         | `/fe-ui-states` | Define todos los estados de UI |

---

## Convenciones (a definir por proyecto)

Completar en `CLAUDE.md`:

- **Idioma del código:** JavaScript/TypeScript/Python/etc.
- **Idioma de commits:** Spanish/English
- **Estilo de nombres:** camelCase/snake_case/PascalCase
- **Otros:** [branching strategy, PR templates, etc.]

---

## Notas importantes

### ✅ Qué está listo

- Estructura de documentación completa
- Skills para cada fase del desarrollo
- Flujo de trabajo optimizado (validaciones entre pasos)
- Templates para brief, historias, flows, screens, API, DB
- ai-library con agentes reutilizables

### ⚠️ Qué completar en cada proyecto

- Stack técnico específico (lenguajes, frameworks, versiones)
- Decisiones de arquitectura (según el producto)
- Convenciones de código (idioma, estilo, naming)
- Setup local y CI/CD (fuera del scope de este template)

### 📌 Lecciones aprendidas (SeekOps)

1. **Preview UX es crítico** — agrégalo entre Screens y DB para evitar rediseño en código
2. **Resuelve pendientes temprano** — no esperes a la API; decídelos durante UX flows
3. **Una aprobación por etapa** — no avances sin validar con el cliente/PM
4. **context.md es sagrado** — actualízalo después de cada decisión relevante

---

## Archivos que NO cambiar (son reutilizables)

- `.claude/skills/*` — skills están hardcodeados, no editables aquí
- `ai-library/*` — agentes reutilizables, copiar pero no modificar

---

## El flujo en acción (ejemplo)

```
Día 1: Llenar brief.md, obtener aprobación
  ↓
Día 2-3: Escribir historias US-001..US-010 con /pm-story, validar con cliente
  ↓
Día 4-5: Definir flows con /ux-user-flow, ajustar fricciones
  ↓
Día 6-7: Especificar screens con /ux-screen-spec, una por una
  ↓
Día 8: Mockup HTML estático (Preview UX), validar visualmente
  ↓
Día 9: Cerrar pendientes en pendientes.md
  ↓
Día 10: DB con /db-schema-design, crear migraciones
  ↓
Día 11-12: API contracts con /be-api-contract, generar mocks JSON
  ↓
Día 13+: Desarrollo de código, integrando todo lo anterior
```

---

## Soporte

- Preguntas sobre los skills: `/help` dentro de Claude Code
- Reportar issues: https://github.com/anthropics/claude-code/issues
- Feedback del template: Documentar en `.ai/context.md` → actualizaciones futuras

---

