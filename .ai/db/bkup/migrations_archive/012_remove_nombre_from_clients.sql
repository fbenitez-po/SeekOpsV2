-- Elimina el campo nombre de la tabla clients.
-- razon_social pasa a ser el identificador principal obligatorio.

-- UP
ALTER TABLE clients DROP COLUMN IF EXISTS nombre;
ALTER TABLE clients ALTER COLUMN razon_social SET NOT NULL;

-- DOWN
-- ALTER TABLE clients ALTER COLUMN razon_social DROP NOT NULL;
-- ALTER TABLE clients ADD COLUMN nombre VARCHAR(100);
-- UPDATE clients SET nombre = COALESCE(razon_comercial, razon_social, 'Sin nombre');
-- ALTER TABLE clients ALTER COLUMN nombre SET NOT NULL;
