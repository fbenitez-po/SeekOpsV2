# Design — migrate-dashboard-seekers

## Contexto

v1 expone una "API Dashboard" de endpoints abiertos y read-only para BI. Los cuatro comparten firma: `permission_classes = []`, `pagination_class = None`, `list` devuelve un array plano (proyección desnormalizada). Este change migra el primero (`seekers`) a v2 y establece el módulo paraguas `dashboard` que alojará el resto.

Fuente v1:
- View: [apps/bi/views.py → SeekerViewSet](../../../../seek-ops/wapp/apps/bi/views.py)
- Serializer: [apps/bi/serializers.py → SeekerSerializer](../../../../seek-ops/wapp/apps/bi/serializers.py)
- Modelo: [apps/users/models.py → User](../../../../seek-ops/wapp/apps/users/models.py)

## Decisiones

### 1. Módulo `dashboard` aparte (no dentro de `users`)
El consumidor es una integración externa (BI). Su contrato debe ser **estable e independiente** de la evolución interna de `users`. Un módulo paraguas propio aísla ese contrato y agrupa los futuros recursos (`projects`, `commercial`, `clients`). Sigue el precedente de `finance/` (paraguas con sub-módulos `periods`, `revenues`, ...).

```
modules/dashboard/
├── dashboard.routes.ts          monta los sub-routers
└── seekers/
    ├── seekers.routes.ts        GET '/'
    ├── seekers.controller.ts
    ├── seekers.service.ts
    ├── seekers.repository.ts    prisma.users.findMany({ include: { teams } })
    └── seekers.mapper.ts        v2 → contrato v1 (inglés)
```

### 2. Repository propio, sin reusar `users.service`
El `users.service` pagina (`{ data, pagination }`), exige auth y mapea a claves en **español** (`nombres`, `apellidos`, `equipo`). El contrato de seekers es lo opuesto: array plano, abierto, claves en **inglés**. Reusarlo acoplaría el contrato externo a lógica interna ajena. El sub-módulo tiene su propia query read-only contra las mismas tablas. La "duplicación" es aislamiento de contrato deliberado, no deuda.

### 3. Claves en inglés — excepción al spec `api-contract`
El spec `api-contract` exige claves en español para la API v2. Este endpoint es una **excepción consciente y documentada**: replica el contrato de v1 (`email, first_name, last_name, job, cellphone, document_number, team, is_active`) para no romper al consumidor BI existente. La traducción ocurre en el `mapper`, igual que en el resto del backend; lo que cambia es el idioma destino.

Mapeo:

| v2 `users` (interno) | contrato v1 (respuesta) |
|---|---|
| `email` | `email` |
| `first_name` | `first_name` |
| `last_name` | `last_name` |
| `position` | `job` |
| `mobile_phone` | `cellphone` |
| `document_number` | `document_number` |
| `teams.name` | `team` (string, `null` si sin equipo) |
| `is_active` | `is_active` |

`Team.__str__` en v1 devuelve `name`, por lo que `teams.name` es el equivalente exacto.

### 4. Abierto ahora, con hook de auth para después
v1 no tiene auth (`permission_classes = []`). v2 replica eso: el router del módulo **no** aplica `verifyToken`/`adminOnly`. Se deja previsto un único punto (un middleware `dashboardAuth` montable en `dashboard.routes.ts`) para introducir, si se decide, un guard de token compartido al estilo `require_token(?token=...)` que v1 usa en sus otros endpoints de BI — sin tocar los sub-recursos.

### 5. Sin paginación, todos los usuarios
Fidelidad con v1: `User.objects.all()` sin filtros → array completo. No se filtra `is_active` ni staff. (Ver pregunta abierta.)

### 6. Esquema de URL agrupado
`GET /api/dashboard/seekers` (bajo `env.API_PREFIX`). Se normaliza respecto de v1 (donde `seekers` colgaba de la raíz y los demás de `/api/`); el consumidor BI se re-apunta a las nuevas rutas agrupadas.

## Preguntas abiertas

- **¿Filtrar inactivos / usuarios de sistema?** Default actual: devolver todos (fidelidad v1). Si BI no quiere ver inactivos ni el admin, se agrega un filtro en el repository. Decisión diferible sin bloquear.
- **¿Auth futura?** Abierto hoy; el hook queda listo para token compartido cuando se evalúe.
