-- ============================================================
-- SEEKOPS — Migración 03: Clientes
-- Origen: seekops_old (Django)
-- Destino: seekops
-- Requiere: migration_02_users.sql aplicado
-- Criterio is_active: todos los clientes se migran como true
-- ============================================================

CREATE EXTENSION IF NOT EXISTS dblink;

BEGIN;

INSERT INTO clients (
  legal_name, trade_name, ruc, address,
  segmentation_id, sector_id, is_active, created_at, created_by
)
SELECT
  c.business_reason,
  c.business_name,
  NULLIF(c.business_number, ''),
  NULLIF(c.fiscal_address, ''),
  cs.id,
  s.id,
  true,
  COALESCE(c.created_at, NOW()),
  'migration'
FROM dblink('dbname=seekops_old user=postgres',
  'SELECT c.id, c.business_reason, c.business_name, c.business_number,
          c.fiscal_address, c.sector_id, c.segmentation_id, c.created_at
   FROM projects_client c'
) AS c(id bigint, business_reason varchar, business_name varchar,
       business_number varchar, fiscal_address varchar,
       sector_id bigint, segmentation_id bigint, created_at timestamptz)
LEFT JOIN (
  SELECT old.id AS old_id, n.id
  FROM dblink('dbname=seekops_old user=postgres','SELECT id, name FROM masters_segmentation') AS old(id bigint, name varchar)
  JOIN client_segmentations n ON n.name = old.name
) cs ON cs.old_id = c.segmentation_id
LEFT JOIN (
  SELECT old.id AS old_id, n.id
  FROM dblink('dbname=seekops_old user=postgres','SELECT id, name FROM masters_sector') AS old(id bigint, name varchar)
  JOIN client_sectors n ON n.name = old.name
) s ON s.old_id = c.sector_id
ON CONFLICT DO NOTHING;

COMMIT;

-- Verificación
SELECT
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE is_active = true) AS activos,
  COUNT(*) FILTER (WHERE is_active = false) AS inactivos,
  COUNT(ruc) AS con_ruc,
  COUNT(segmentation_id) AS con_segmentacion,
  COUNT(sector_id) AS con_sector
FROM clients;
