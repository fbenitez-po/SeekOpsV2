-- ============================================================
-- SEEKOPS — Migración 05: Proyecciones de horas
-- Origen: seekops_old (Django)
-- Destino: seekops
-- Requiere: migration_02_users.sql + migration_04_projects.sql aplicados
-- Tablas origen:
--   projects_blockoriginal         → cabecera (proyecto, estado)
--   projects_blockoriginalschedule → detalle  (usuario, horas, fechas, categoría)
-- Tabla destino: hour_projections (estructura aplanada)
--
-- Ajustes aplicados a datos sucios:
--   - hours no múltiplo de 0.5 → ROUND(hours * 2) / 2.0
--   - end_date < start_date    → fechas intercambiadas con LEAST/GREATEST
--   - hours <= 0, NULL o redondean a 0 → excluidos
--   - status 'Anulado'         → is_active = false
--   - Sin usuario/proyecto en nueva BD → excluidos (JOIN implícito)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS dblink;

BEGIN;

INSERT INTO hour_projections (
  project_id, user_id, work_category_id,
  start_date, end_date, projected_hours,
  is_active, created_at, created_by
)
SELECT
  p.id,
  u.id,
  wc.id,
  LEAST(src.start_date, src.end_date),
  GREATEST(src.start_date, src.end_date),
  ROUND(src.hours::numeric * 2) / 2.0,
  CASE src.status WHEN 'Anulado' THEN false ELSE true END,
  COALESCE(src.created_at, NOW()),
  'migration'
FROM dblink('dbname=seekops_old user=postgres',
  'SELECT
     bs.hours,
     bs.start_date,
     bs.end_date,
     bs.category_id,
     pp.code        AS project_code,
     uu.email       AS user_email,
     b.status,
     b.created_at
   FROM projects_blockoriginalschedule bs
   JOIN projects_blockoriginal b  ON b.id  = bs.block_id
   JOIN projects_project pp       ON pp.id = b.project_id
   JOIN users_user uu             ON uu.id = bs.user_id
   WHERE bs.hours > 0
     AND bs.hours IS NOT NULL
     AND bs.start_date IS NOT NULL
     AND bs.end_date   IS NOT NULL
     AND ROUND(bs.hours::numeric * 2) / 2.0 > 0'
) AS src(
  hours        float,
  start_date   date,
  end_date     date,
  category_id  bigint,
  project_code varchar,
  user_email   varchar,
  status       varchar,
  created_at   timestamptz
)
-- Proyecto (obligatorio)
JOIN projects p ON p.code = src.project_code
-- Usuario (obligatorio)
JOIN users u ON u.email = src.user_email
-- Categoría de trabajo (opcional — NULL si no está mapeada)
LEFT JOIN (
  SELECT old.id AS old_id, n.id
  FROM dblink('dbname=seekops_old user=postgres',
    'SELECT id, name FROM masters_usercategory'
  ) AS old(id bigint, name varchar)
  JOIN work_categories n ON n.name = old.name
) wc ON wc.old_id = src.category_id
ON CONFLICT DO NOTHING;

COMMIT;

-- Verificación
SELECT
  COUNT(*)                                          AS total,
  COUNT(*) FILTER (WHERE is_active = true)          AS activos,
  COUNT(*) FILTER (WHERE is_active = false)         AS anulados,
  COUNT(work_category_id)                           AS con_categoria,
  COUNT(*) - COUNT(work_category_id)                AS sin_categoria,
  MIN(start_date)                                   AS fecha_mas_antigua,
  MAX(end_date)                                     AS fecha_mas_reciente
FROM hour_projections;
