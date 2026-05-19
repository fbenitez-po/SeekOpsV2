# Migrations Archive

Historial completo de migraciones incrementales (001 en adelante). Aquí se agregan todas las migraciones futuras.

## Reglas

- **BD desde cero:** usar `../setup_schema.sql` + `../setup_seeds.sql`. No ejecutar estas migraciones.
- **BD existente con datos:** aplicar solo la migración incremental correspondiente.
- **Cada migración nueva debe:** aplicar el delta (ALTER, CREATE, INSERT, etc.) sobre la BD existente Y actualizarse `../setup_schema.sql` y `../schema.md` para reflejar el estado final.

## Fuente de verdad del schema

- `../setup_schema.sql` — DDL completo y actualizado (todas las tablas, índices y constraints)
- `../setup_seeds.sql` — Seeds iniciales
- `../schema.md` — Documentación del schema

## Cómo agregar una migración

1. Crear `NNN_nombre_descriptivo.sql` siguiendo la numeración (020, 021, …)
2. Escribir solo el delta necesario (no DROP + recreate)
3. Actualizar `../setup_schema.sql` con el cambio incorporado
4. Actualizar `../schema.md` con la tabla/columna afectada
