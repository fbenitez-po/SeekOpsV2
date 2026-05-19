-- ============================================================
-- Migración 021 — Renombrar client_categories → work_categories
--
-- La tabla client_categories contenía categorías de tipo de trabajo
-- (backend, frontend, etc.), no categorías de cliente.
-- Se corrige el nombre y se elimina la FK incorrecta en clients.
-- ============================================================

BEGIN;

-- 1. Renombrar la tabla
ALTER TABLE client_categories RENAME TO work_categories;

-- 2. Renombrar el índice
ALTER INDEX idx_client_categories_codigo RENAME TO idx_work_categories_codigo;

-- 3. Eliminar FK y columna incorrecta en clients
ALTER TABLE clients DROP CONSTRAINT clients_client_category_id_fkey;
ALTER TABLE clients DROP COLUMN client_category_id;

-- 4. Renombrar columna en hour_projections
ALTER TABLE hour_projections RENAME COLUMN categoria_id TO work_category_id;

-- 5. Renombrar índice de hour_projections
ALTER INDEX idx_hour_projections_categoria_id RENAME TO idx_hour_projections_work_category_id;

COMMIT;
