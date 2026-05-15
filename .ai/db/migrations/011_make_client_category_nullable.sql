-- Migración 011: Hacer client_category_id nullable en clients
-- La categoría de cliente se eliminó del formulario de alta/edición

-- UP
ALTER TABLE clients ALTER COLUMN client_category_id DROP NOT NULL;

-- DOWN
-- ALTER TABLE clients ALTER COLUMN client_category_id SET NOT NULL;
