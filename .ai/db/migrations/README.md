# Migraciones PostgreSQL — Seekops

## Estructura

Las migraciones se ejecutan **en orden**:

1. **`001_initial_config_tables.sql`** — Tablas de configuración (roles, statuses, categorías, etc.) + seeds
2. **`002_core_tables.sql`** — Tablas core (users, clients, projects) con auditoría
3. **`003_relationships_and_timeentries.sql`** — Relaciones M2M y time_entries (cabecera, líneas, approvals)

## Ejecución

### Primera vez (setup inicial)

```bash
psql -U postgres -d seekops < 001_initial_config_tables.sql
psql -U postgres -d seekops < 002_core_tables.sql
psql -U postgres -d seekops < 003_relationships_and_timeentries.sql
```

### Revertir (en reverso)

```bash
psql -U postgres -d seekops < 003_relationships_and_timeentries.sql  -- DOWN
psql -U postgres -d seekops < 002_core_tables.sql                   -- DOWN
psql -U postgres -d seekops < 001_initial_config_tables.sql         -- DOWN
```

## Características de las migraciones

✅ **Sin downtime:** Las migraciones pueden ejecutarse en paralelo a la aplicación.  
✅ **Sin pérdida de datos:** Las operaciones son aditivas (CREATE TABLE, INSERT).  
✅ **Reversibles:** Cada migración incluye sentencias DOWN para revertir.  
✅ **Idempotentes en config:** Las tablas de configuración usan INSERT (no duplicarán si se ejecutan dos veces; usar DELETE antes si es necesario).

## Precauciones

### Antes de ejecutar

1. **Backup de BD:** Hacer backup antes de aplicar migraciones en producción.
2. **Verificar dependencias:** 001 → 002 → 003 (orden obligatorio).
3. **Conectarse como usuario con permisos:** Usuario con permisos de CREATE TABLE.

### Después de ejecutar

1. **Verificar índices:** Correr `\di` en psql para listar índices creados.
2. **Verificar constraints:** Correr `\d [tabla]` para verificar que cada tabla tiene sus FK y constraints.
3. **Validar seeds:** Verificar que la data de configuración se insertó:
   ```sql
   SELECT * FROM roles;
   SELECT * FROM approval_statuses;
   SELECT * FROM user_groups;
   ```

## Notas de diseño

- **UUIDs:** Todos los IDs son UUID con `gen_random_uuid()`.
- **Soft delete:** Tablas de entidades (users, clients, projects, project_users) tienen campo `activo`.
- **Auditoria:** Todas las tablas tienen `created_at`, `updated_at`, `created_by`, `updated_by` (FK a users).
- **Timezone:** Usar UTC en aplicación. Timestamps se guardan sin timezone (UTC asumido).
- **FK con CASCADE:** Relaciones dependientes (user_group_members, project_users, time_entries) eliminan datos al borrar padre.
- **FK con SET NULL:** Auditoría (created_by, updated_by) preserva registros si usuario se elimina.

## Próximas migraciones (futuro)

Si agregás columnas, tablas o cambios:
- Crear archivo `004_cambio_descripcion.sql`
- Mantener el mismo patrón: UP/DOWN, indices, constraints

---

**Última actualización:** 23 de Abril 2026
