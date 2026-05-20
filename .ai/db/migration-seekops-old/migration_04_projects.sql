-- ============================================================
-- SEEKOPS — Migración 04: Proyectos
-- Origen: seekops_old (Django)
-- Destino: seekops
-- Requiere: migration_02_users.sql + migration_03_clients.sql aplicados
-- Notas:
--   - status 'open'  → is_active = true
--   - status 'close' → is_active = false
--   - division_id duplicado I002: se resuelve por nombre exacto
--   - manager_id: NULL si el manager no existe en la nueva BD
--   - project_segmentation_id: NULL si el proyecto no tiene división
-- ============================================================

CREATE EXTENSION IF NOT EXISTS dblink;

BEGIN;

-- Proyectos
INSERT INTO projects (
  code, name, client_id, manager_id,
  project_segmentation_id, productivity_layer_id,
  start_date, end_date, actual_start_date, actual_end_date,
  is_active, created_at, created_by
)
SELECT
  p.code,
  p.name,
  c.id,
  u.id,
  ps.id,
  pl.id,
  p.start_date,
  p.end_date,
  p.real_start_date,
  p.real_end_date,
  CASE p.status WHEN 'open' THEN true ELSE false END,
  COALESCE(p.created_at, NOW()),
  'migration'
FROM dblink('dbname=seekops_old user=postgres',
  'SELECT p.id, p.code, p.name, p.status,
          p.start_date, p.end_date, p.real_start_date, p.real_end_date,
          p.client_id, p.manager_id, p.division_id, p.layer_productivity_id,
          p.created_at
   FROM projects_project p'
) AS p(id bigint, code varchar, name varchar, status varchar,
       start_date date, end_date date, real_start_date date, real_end_date date,
       client_id bigint, manager_id bigint, division_id bigint,
       layer_productivity_id bigint, created_at timestamptz)
-- Cliente
LEFT JOIN (
  SELECT old.id AS old_id, n.id
  FROM dblink('dbname=seekops_old user=postgres','SELECT id, business_reason FROM projects_client') AS old(id bigint, business_reason varchar)
  JOIN clients n ON n.legal_name = old.business_reason
) c ON c.old_id = p.client_id
-- Manager (NULL si no existe en nueva BD)
LEFT JOIN (
  SELECT old.id AS old_id, n.id
  FROM dblink('dbname=seekops_old user=postgres','SELECT id, email FROM users_user') AS old(id bigint, email varchar)
  JOIN users n ON n.email = old.email
) u ON u.old_id = p.manager_id
-- División → project_segmentation (NULL si no tiene división)
LEFT JOIN (
  SELECT old.id AS old_id, n.id
  FROM dblink('dbname=seekops_old user=postgres','SELECT id, name FROM masters_division') AS old(id bigint, name varchar)
  JOIN project_segmentation n ON n.name = old.name
) ps ON ps.old_id = p.division_id
-- Capa de productividad
LEFT JOIN (
  SELECT old.id AS old_id, n.id
  FROM dblink('dbname=seekops_old user=postgres','SELECT id, name FROM masters_layerproductivity') AS old(id bigint, name varchar)
  JOIN productivity_layers n ON n.name = old.name
) pl ON pl.old_id = p.layer_productivity_id
-- Solo insertar si tiene cliente mapeado
WHERE c.id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Categorías de proyecto (M2M)
INSERT INTO project_project_category (project_id, project_category_id)
SELECT proj.id, pc.id
FROM dblink('dbname=seekops_old user=postgres',
  'SELECT p.code, ec.name
   FROM projects_project_category_extension pce
   JOIN projects_project p ON p.id = pce.project_id
   JOIN masters_extensioncategory ec ON ec.id = pce.extensioncategory_id'
) AS src(code varchar, cat_name varchar)
JOIN projects proj ON proj.code = src.code
JOIN project_categories pc ON pc.name = trim(regexp_replace(src.cat_name, '\s+', ' ', 'g'))
ON CONFLICT DO NOTHING;

-- Miembros de proyecto (M2M)
-- role = 'SEEKER': el backend filtra por este valor para listar miembros que registran horas
INSERT INTO project_user (project_id, user_id, role)
SELECT proj.id, u.id, 'SEEKER'
FROM dblink('dbname=seekops_old user=postgres',
  'SELECT p.code, uu.email
   FROM projects_project_users ppu
   JOIN projects_project p ON p.id = ppu.project_id
   JOIN users_user uu ON uu.id = ppu.user_id'
) AS src(code varchar, email varchar)
JOIN projects proj ON proj.code = src.code
JOIN users u ON u.email = src.email
ON CONFLICT DO NOTHING;

COMMIT;

-- Verificación
SELECT
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE is_active = true) AS activos,
  COUNT(*) FILTER (WHERE is_active = false) AS cerrados,
  COUNT(manager_id) AS con_manager,
  COUNT(*) - COUNT(manager_id) AS sin_manager,
  COUNT(project_segmentation_id) AS con_division
FROM projects;
