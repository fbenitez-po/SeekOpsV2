-- ============================================================
-- SEEKOPS — Migración completa: seekops_old → seekops
-- Pasos: 2 (usuarios) → 3 (clientes) → 4 (proyectos)
--        → 5 (proyecciones de horas) → 6 (registros comerciales)
--
-- Requiere:
--   - dblink habilitado en PostgreSQL
--   - schema.sql + data.sql aplicados en seekops
--   - seekops_old accesible en el mismo servidor PostgreSQL
--
-- Idempotente: ON CONFLICT DO NOTHING en todos los INSERT.
-- Transacciones separadas por paso: si un paso falla, los
-- anteriores ya están comprometidos.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS dblink;


-- ── PASO 2: Usuarios ──────────────────────────────────────────
-- Tablas: users, user_area, user_profile
-- Origen: users_user, users_user_area, users_user_groups, auth_group
-- Password temporal: Admin123! — se re-hashea a bcrypt en primer login

BEGIN;

INSERT INTO users (
  email, password_hash, first_name, last_name, document_number,
  position, mobile_phone, team_id, hire_date, is_active, is_staff,
  is_superuser, created_at, created_by
)
SELECT
  u.email,
  '$2a$10$k7CkE/Pwe48IjA.zsQdfAOUJRImHuxUsqXjx318MM9y79wVxxxJeC',
  u.first_name,
  u.last_name,
  NULLIF(TRIM(u.document_number), ''),
  NULLIF(TRIM(u.job), ''),
  NULLIF(TRIM(u.cellphone), ''),
  t.id,
  NULL,         -- hire_date: no existe en old, completar manualmente
  u.is_active,
  u.is_staff,
  u.is_superuser,
  u.created::timestamp,
  'migration'
FROM dblink('dbname=seekops_old user=postgres',
  'SELECT email, first_name, last_name, document_number, job, cellphone,
          team_id, is_active, is_staff, is_superuser, created
   FROM users_user
   WHERE email != ''admin@seekglobal.co'''
) AS u(email varchar, first_name varchar, last_name varchar,
       document_number varchar, job varchar, cellphone varchar,
       team_id bigint, is_active bool, is_staff bool,
       is_superuser bool, created timestamptz)
LEFT JOIN (
  SELECT old_t.id AS old_id, n.id
  FROM dblink('dbname=seekops_old user=postgres','SELECT id, name FROM masters_team') AS old_t(id bigint, name varchar)
  JOIN teams n ON n.name = old_t.name
) tm ON tm.old_id = u.team_id
LEFT JOIN teams t ON t.id = tm.id
ON CONFLICT (email) DO NOTHING;

INSERT INTO user_area (user_id, area_id)
SELECT u.id, a.id
FROM dblink('dbname=seekops_old user=postgres',
  'SELECT uu.email, ma.name
   FROM users_user_area ua
   JOIN users_user uu ON uu.id = ua.user_id
   JOIN masters_area ma ON ma.id = ua.area_id'
) AS src(email varchar, area_name varchar)
JOIN users u ON u.email = src.email
JOIN areas a ON a.name = src.area_name
ON CONFLICT DO NOTHING;

-- Perfil ADMIN (superusers)
INSERT INTO user_profile (user_id, profile_id)
SELECT u.id, p.id
FROM users u, profiles p
WHERE u.is_superuser = true AND p.code = 'ADMIN' AND u.email != 'admin@seekglobal.co'
ON CONFLICT DO NOTHING;

-- Perfil GESTOR (grupo "Gestor Registro de horas")
INSERT INTO user_profile (user_id, profile_id)
SELECT u.id, p.id
FROM dblink('dbname=seekops_old user=postgres',
  'SELECT uu.email
   FROM users_user_groups ug
   JOIN users_user uu ON uu.id = ug.user_id
   JOIN auth_group ag ON ag.id = ug.group_id
   WHERE ag.name = ''Gestor Registro de horas'''
) AS src(email varchar)
JOIN users u ON u.email = src.email
JOIN profiles p ON p.code = 'GESTOR'
ON CONFLICT DO NOTHING;

-- Perfil SEEKER (grupo "Seeker")
INSERT INTO user_profile (user_id, profile_id)
SELECT u.id, p.id
FROM dblink('dbname=seekops_old user=postgres',
  'SELECT uu.email
   FROM users_user_groups ug
   JOIN users_user uu ON uu.id = ug.user_id
   JOIN auth_group ag ON ag.id = ug.group_id
   WHERE ag.name = ''Seeker'''
) AS src(email varchar)
JOIN users u ON u.email = src.email
JOIN profiles p ON p.code = 'SEEKER'
ON CONFLICT DO NOTHING;

COMMIT;


-- ── PASO 3: Clientes ──────────────────────────────────────────
-- Tablas: clients
-- Origen: projects_client
-- is_active: todos migran como true

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


-- ── PASO 4: Proyectos ─────────────────────────────────────────
-- Tablas: projects, project_project_category, project_user
-- Origen: projects_project, projects_project_category_extension, projects_project_users
-- status 'open' → is_active = true | 'close' → false

BEGIN;

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
LEFT JOIN (
  SELECT old.id AS old_id, n.id
  FROM dblink('dbname=seekops_old user=postgres','SELECT id, business_reason FROM projects_client') AS old(id bigint, business_reason varchar)
  JOIN clients n ON n.legal_name = old.business_reason
) c ON c.old_id = p.client_id
LEFT JOIN (
  SELECT old.id AS old_id, n.id
  FROM dblink('dbname=seekops_old user=postgres','SELECT id, email FROM users_user') AS old(id bigint, email varchar)
  JOIN users n ON n.email = old.email
) u ON u.old_id = p.manager_id
LEFT JOIN (
  SELECT old.id AS old_id, n.id
  FROM dblink('dbname=seekops_old user=postgres','SELECT id, name FROM masters_division') AS old(id bigint, name varchar)
  JOIN project_segmentation n ON n.name = old.name
) ps ON ps.old_id = p.division_id
LEFT JOIN (
  SELECT old.id AS old_id, n.id
  FROM dblink('dbname=seekops_old user=postgres','SELECT id, name FROM masters_layerproductivity') AS old(id bigint, name varchar)
  JOIN productivity_layers n ON n.name = old.name
) pl ON pl.old_id = p.layer_productivity_id
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


-- ── PASO 5: Proyecciones de horas ─────────────────────────────
-- Tablas: hour_projections
-- Origen: projects_blockoriginal (cabecera) + projects_blockoriginalschedule (detalle)
-- Ajustes aplicados:
--   hours no múltiplo de 0.5 → ROUND(hours * 2) / 2.0
--   end_date < start_date    → fechas intercambiadas con LEAST/GREATEST
--   status 'Anulado'         → is_active = false

BEGIN;

-- Limpieza idempotente: estas tablas no tienen unique natural, así que el
-- ON CONFLICT no atrapa duplicados. Se borran las filas de migración previas.
DELETE FROM hour_projections WHERE created_by = 'migration';

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
JOIN projects p ON p.code = src.project_code
JOIN users u ON u.email = src.user_email
LEFT JOIN (
  SELECT old.id AS old_id, n.id
  FROM dblink('dbname=seekops_old user=postgres',
    'SELECT id, name FROM masters_usercategory'
  ) AS old(id bigint, name varchar)
  JOIN work_categories n ON n.name = old.name
) wc ON wc.old_id = src.category_id
ON CONFLICT DO NOTHING;

COMMIT;


-- ── PASO 6: Registros comerciales ─────────────────────────────
-- Tablas: commercial_records
-- Origen: commercial_commercial
-- owner_id resolution: responsible → manager del proyecto → admin@seekglobal.co
-- 1 registro excluido: id=206, precio negativo

BEGIN;

-- Limpieza idempotente (misma razón que en el Paso 5)
DELETE FROM commercial_records WHERE created_by = 'migration';

INSERT INTO commercial_records (
  record_date, project_id, owner_id,
  detail, price, currency,
  document_type_id, has_contract, is_billed,
  evidence_filename, created_at, created_by
)
SELECT
  src.date,
  p.id,
  COALESCE(u_resp.id, u_mgr.id, u_admin.id),
  NULLIF(TRIM(src.detail), ''),
  src.price,
  src.coin,
  dt.id,
  src.status,
  src.billing,
  NULLIF(TRIM(src.evidence_file), ''),
  COALESCE(src.created_at, NOW()),
  'migration'
FROM dblink('dbname=seekops_old user=postgres',
  'SELECT
     c.id,
     c.detail,
     c.price,
     c.coin,
     c.date,
     c.status,
     c.billing,
     c.evidence_file,
     c.created_at,
     c.document,
     pp.code         AS project_code,
     uu_resp.email   AS responsible_email,
     uu_mgr.email    AS manager_email
   FROM commercial_commercial c
   JOIN projects_project pp      ON pp.id = c.project_id
   LEFT JOIN users_user uu_resp  ON uu_resp.id = c.responsible_id
   LEFT JOIN users_user uu_mgr   ON uu_mgr.id  = pp.manager_id
   WHERE c.date IS NOT NULL
     AND c.price IS NOT NULL
     AND c.price >= 0'
) AS src(
  id              bigint,
  detail          text,
  price           numeric,
  coin            varchar,
  date            date,
  status          boolean,
  billing         boolean,
  evidence_file   varchar,
  created_at      timestamptz,
  document        varchar,
  project_code    varchar,
  responsible_email varchar,
  manager_email   varchar
)
JOIN projects p ON p.code = src.project_code
LEFT JOIN users u_resp ON u_resp.email = src.responsible_email
LEFT JOIN users u_mgr  ON u_mgr.email  = src.manager_email
CROSS JOIN (SELECT id FROM users WHERE email = 'admin@seekglobal.co') u_admin
LEFT JOIN document_types dt ON dt.name = src.document
ON CONFLICT DO NOTHING;

COMMIT;


-- ── PASO 7: Horas trabajadas y aprobaciones ───────────────────
-- Tablas: time_entries (cabecera semanal) + time_entry_lines (horas originales
--         del seeker) + time_entry_approvals (estado y sugerencias del gestor).
-- Origen: seekers_hoursworkedhead (cabecera) + seekers_hoursworked (detalle).
--
-- Modelo (2026-05-26): time_entries y time_entry_lines NO tienen columna status.
-- time_entry_approvals es la fuente de verdad (1 fila por línea, UNIQUE).
-- Las horas en time_entry_lines son siempre las originales del seeker.
-- Si el gestor ajustó horas → suggested_hours/suggested_extra_hours +
-- estado APROBADO_CON_OBSERVACION.  No se crean líneas con baja lógica.
--
-- Reglas:
--   - Una time_entry por (usuario, date_init): el viejo parte la semana en
--     varias heads (una por proyecto); aquí se FUSIONAN.
--   - week_start_date = date_init ; week_end_date = date_init + 6 (Domingo).
--   - Se EXCLUYEN las heads con rango roto (date_end < date_init o span > 7d):
--     quedan listadas en paso7_fechas_rotas_pendientes.sql para corregir a mano.
--   - Líneas con hours NULL u horas negativas se omiten.
--   - description → time_entry_lines.comment ; justification → approvals.comment.
--
-- Idempotente: al inicio se borran las filas de esta migración
-- (created_by='migration'); el FK ON DELETE CASCADE limpia líneas y aprobaciones.

BEGIN;

-- Limpieza idempotente (cascade a time_entry_lines y time_entry_approvals)
DELETE FROM time_entries WHERE created_by = 'migration';

-- 7.1 — Cabeceras semanales (fusionadas por usuario + date_init, sin status)
INSERT INTO time_entries (
  user_id, week_start_date, week_end_date, created_at, created_by
)
SELECT
  u.id,
  src.date_init,
  src.date_init + 6,
  NOW(),
  'migration'
FROM dblink('dbname=seekops_old user=postgres',
  'SELECT uu.email, h.date_init
   FROM seekers_hoursworked l
   JOIN seekers_hoursworkedhead h ON h.id = l.head_id
   JOIN users_user uu ON uu.id = h.user_id
   WHERE h.date_init IS NOT NULL
     AND h.date_end >= h.date_init
     AND (h.date_end - h.date_init) <= 7
     AND l.hours IS NOT NULL
     AND l.hours >= 0
   GROUP BY uu.email, h.date_init'
) AS src(email varchar, date_init date)
JOIN users u ON u.email = src.email
ON CONFLICT (user_id, week_start_date) DO NOTHING;

-- 7.2 — Líneas de detalle (horas ORIGINALES del seeker, sin status)
INSERT INTO time_entry_lines (
  time_entry_id, project_id, income_category_id,
  hours, extra_hours, comment,
  created_at, created_by, is_active
)
SELECT
  te.id,
  p.id,
  pc.id,
  src.hours,
  src.extra_hours,
  src.comment,
  NOW(),
  'migration',
  true
FROM dblink('dbname=seekops_old user=postgres',
  'SELECT
     uu.email                              AS email,
     h.date_init                           AS date_init,
     pp.code                               AS project_code,
     ec.name                               AS cat_name,
     SUM(l.hours)::numeric                 AS hours,
     SUM(COALESCE(l.extra_hours, 0))::numeric AS extra_hours,
     string_agg(NULLIF(TRIM(l.description), ''''), '' | '') AS comment
   FROM seekers_hoursworked l
   JOIN seekers_hoursworkedhead h ON h.id = l.head_id
   JOIN users_user uu ON uu.id = h.user_id
   JOIN projects_project pp ON pp.id = l.project_id
   LEFT JOIN masters_extensioncategory ec ON ec.id = l.category_extension_id
   WHERE h.date_init IS NOT NULL
     AND h.date_end >= h.date_init
     AND (h.date_end - h.date_init) <= 7
     AND l.hours IS NOT NULL
     AND l.hours >= 0
   GROUP BY uu.email, h.date_init, pp.code, ec.name'
) AS src(email varchar, date_init date, project_code varchar, cat_name varchar,
         hours numeric, extra_hours numeric, comment text)
JOIN users u ON u.email = src.email
JOIN time_entries te ON te.user_id = u.id AND te.week_start_date = src.date_init
JOIN projects p ON p.code = src.project_code
LEFT JOIN project_categories pc ON pc.name = trim(regexp_replace(src.cat_name, '\s+', ' ', 'g'))
ON CONFLICT DO NOTHING;

-- 7.3 — Aprobaciones (una por línea activa; APROBADO_CON_OBSERVACION cuando
--        el gestor ajustó las horas originales del seeker)
INSERT INTO time_entry_approvals (
  time_entry_line_id, status, comment,
  suggested_hours, suggested_extra_hours,
  reviewed_by, reviewed_at,
  created_at, created_by
)
SELECT
  tel.id,
  CASE
    WHEN src.all_approved
         AND ( src.sum_validated_hours <> src.sum_hours
            OR src.sum_validated_extra  <> src.sum_extra )
      THEN 'APROBADO_CON_OBSERVACION'
    WHEN src.all_approved THEN 'APROBADO'
    WHEN src.all_rejected THEN 'RECHAZADO'
    ELSE                       'PENDIENTE'
  END,
  src.justification,
  CASE
    WHEN src.all_approved AND src.sum_validated_hours <> src.sum_hours
      THEN src.sum_validated_hours
  END,
  CASE
    WHEN src.all_approved AND src.sum_validated_extra <> src.sum_extra
      THEN src.sum_validated_extra
  END,
  CASE WHEN src.all_approved OR src.all_rejected THEN src.reviewed_by END,
  CASE WHEN src.all_approved OR src.all_rejected THEN src.reviewed_at END,
  NOW(),
  'migration'
FROM dblink('dbname=seekops_old user=postgres',
  'SELECT
     uu.email                              AS email,
     h.date_init                           AS date_init,
     pp.code                               AS project_code,
     ec.name                               AS cat_name,
     bool_and(l.status = ''approved'')     AS all_approved,
     bool_and(l.status = ''rejected'')     AS all_rejected,
     SUM(l.hours)::numeric                 AS sum_hours,
     SUM(COALESCE(l.extra_hours, 0))::numeric AS sum_extra,
     SUM(CASE WHEN l.status = ''approved'' AND l.validated_hours IS NOT NULL
              THEN l.validated_hours ELSE l.hours END)::numeric AS sum_validated_hours,
     SUM(CASE WHEN l.status = ''approved'' AND l.validated_extra_hours IS NOT NULL
              THEN l.validated_extra_hours ELSE COALESCE(l.extra_hours, 0) END)::numeric AS sum_validated_extra,
     string_agg(NULLIF(TRIM(l.justification), ''''), '' | '') AS justification,
     (array_agg(mm.email) FILTER (WHERE l.status IN (''approved'', ''rejected'')))[1] AS reviewed_by,
     max(l.updated_at) FILTER (WHERE l.status IN (''approved'', ''rejected'')) AS reviewed_at
   FROM seekers_hoursworked l
   JOIN seekers_hoursworkedhead h ON h.id = l.head_id
   JOIN users_user uu ON uu.id = h.user_id
   JOIN projects_project pp ON pp.id = l.project_id
   LEFT JOIN masters_extensioncategory ec ON ec.id = l.category_extension_id
   LEFT JOIN users_user mm ON mm.id = l.manager_id
   WHERE h.date_init IS NOT NULL
     AND h.date_end >= h.date_init
     AND (h.date_end - h.date_init) <= 7
     AND l.hours IS NOT NULL
     AND l.hours >= 0
   GROUP BY uu.email, h.date_init, pp.code, ec.name'
) AS src(email varchar, date_init date, project_code varchar, cat_name varchar,
         all_approved bool, all_rejected bool,
         sum_hours numeric, sum_extra numeric,
         sum_validated_hours numeric, sum_validated_extra numeric,
         justification text, reviewed_by varchar, reviewed_at timestamptz)
JOIN users u ON u.email = src.email
JOIN time_entries te ON te.user_id = u.id AND te.week_start_date = src.date_init
JOIN projects p ON p.code = src.project_code
LEFT JOIN project_categories pc ON pc.name = trim(regexp_replace(src.cat_name, '\s+', ' ', 'g'))
JOIN time_entry_lines tel
  ON  tel.time_entry_id = te.id
  AND tel.project_id    = p.id
  AND (tel.income_category_id = pc.id OR (tel.income_category_id IS NULL AND pc.id IS NULL))
  AND tel.is_active     = true
  AND tel.created_by    = 'migration'
ON CONFLICT (time_entry_line_id) DO NOTHING;

COMMIT;


-- ── REPORTE FINAL ─────────────────────────────────────────────

SELECT 'usuarios' AS tabla,
  COUNT(*) FILTER (WHERE email != 'admin@seekglobal.co') AS migrados,
  COUNT(*) FILTER (WHERE is_active = true AND email != 'admin@seekglobal.co') AS activos,
  COUNT(*) FILTER (WHERE is_active = false) AS inactivos
FROM users;

SELECT 'clientes' AS tabla,
  COUNT(*) AS migrados,
  COUNT(*) FILTER (WHERE is_active = true) AS activos,
  COUNT(ruc) AS con_ruc,
  COUNT(segmentation_id) AS con_segmentacion,
  COUNT(sector_id) AS con_sector
FROM clients;

SELECT 'proyectos' AS tabla,
  COUNT(*) AS migrados,
  COUNT(*) FILTER (WHERE is_active = true) AS activos,
  COUNT(*) FILTER (WHERE is_active = false) AS cerrados,
  COUNT(manager_id) AS con_manager,
  COUNT(*) - COUNT(manager_id) AS sin_manager,
  COUNT(project_segmentation_id) AS con_division
FROM projects;

SELECT 'proyecciones_horas' AS tabla,
  COUNT(*) AS migrados,
  COUNT(*) FILTER (WHERE is_active = true) AS activos,
  COUNT(*) FILTER (WHERE is_active = false) AS anulados,
  COUNT(work_category_id) AS con_categoria,
  COUNT(*) - COUNT(work_category_id) AS sin_categoria,
  MIN(start_date) AS fecha_mas_antigua,
  MAX(end_date) AS fecha_mas_reciente
FROM hour_projections;

SELECT 'registros_comerciales' AS tabla,
  COUNT(*) AS migrados,
  COUNT(document_type_id) AS con_tipo_documento,
  COUNT(*) - COUNT(document_type_id) AS sin_tipo_documento,
  COUNT(*) FILTER (WHERE has_contract = true) AS con_contrato,
  COUNT(*) FILTER (WHERE is_billed = true) AS facturados,
  COUNT(evidence_filename) AS con_evidencia,
  SUM(price) FILTER (WHERE currency = 'USD') AS total_usd,
  SUM(price) FILTER (WHERE currency = 'PEN') AS total_pen
FROM commercial_records;

SELECT 'horas_trabajadas' AS tabla,
  (SELECT COUNT(*) FROM time_entries WHERE created_by = 'migration') AS entries,
  (SELECT COUNT(*) FROM time_entry_lines WHERE created_by = 'migration' AND is_active) AS lineas_activas,
  (SELECT COUNT(*) FROM time_entry_approvals WHERE created_by = 'migration' AND status = 'APROBADO') AS aprobadas,
  (SELECT COUNT(*) FROM time_entry_approvals WHERE created_by = 'migration' AND status = 'APROBADO_CON_OBSERVACION') AS con_observacion,
  (SELECT COUNT(*) FROM time_entry_approvals WHERE created_by = 'migration' AND status = 'RECHAZADO') AS rechazadas,
  (SELECT COUNT(*) FROM time_entry_approvals WHERE created_by = 'migration' AND status = 'PENDIENTE') AS pendientes;
