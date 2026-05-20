-- ============================================================
-- SEEKOPS — Migración 06: Registros comerciales
-- Origen: seekops_old (Django) — commercial_commercial
-- Destino: seekops — commercial_records
-- Requiere: migration_02_users.sql + migration_04_projects.sql aplicados
--
-- Mapeo de campos:
--   detail           → detail
--   price            → price
--   coin             → currency (PEN/USD)
--   date             → record_date
--   project_id       → project_id (JOIN por code)
--   responsible_id   → owner_id (fallback: manager del proyecto → admin)
--   document         → document_type_id (JOIN por nombre; 'Correo' → NULL)
--   status (bool)    → has_contract
--   billing (bool)   → is_billed
--   evidence_file    → evidence_filename
--   type (old)       → sin equivalente en nueva BD (se pierde)
--
-- owner_id resolution:
--   1. responsible del registro (si existe en nueva BD)
--   2. manager del proyecto (si existe en nueva BD)
--   3. admin@seekglobal.co (fallback garantizado)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS dblink;

BEGIN;

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
  -- 1 registro excluido: id=206 "perdida de 22,000 soles no reconocidos" (precio negativo)
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
-- Proyecto (obligatorio)
JOIN projects p ON p.code = src.project_code
-- Responsible (opcional)
LEFT JOIN users u_resp ON u_resp.email = src.responsible_email
-- Manager del proyecto como fallback (opcional)
LEFT JOIN users u_mgr  ON u_mgr.email  = src.manager_email
-- Admin como fallback final (siempre existe)
CROSS JOIN (SELECT id FROM users WHERE email = 'admin@seekglobal.co') u_admin
-- Tipo de documento por nombre (Correo no existe → NULL)
LEFT JOIN document_types dt ON dt.name = src.document
ON CONFLICT DO NOTHING;

COMMIT;

-- Verificación
SELECT
  COUNT(*)                                        AS total,
  COUNT(document_type_id)                         AS con_tipo_documento,
  COUNT(*) - COUNT(document_type_id)              AS sin_tipo_documento,
  COUNT(*) FILTER (WHERE has_contract = true)     AS con_contrato,
  COUNT(*) FILTER (WHERE is_billed = true)        AS facturados,
  COUNT(evidence_filename)                        AS con_evidencia,
  SUM(price) FILTER (WHERE currency = 'USD')      AS total_usd,
  SUM(price) FILTER (WHERE currency = 'PEN')      AS total_pen
FROM commercial_records;
