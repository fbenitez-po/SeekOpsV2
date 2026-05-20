-- ============================================================
-- SEEKOPS — Migración 02: Usuarios
-- Origen: seekops_old (Django)
-- Destino: seekops
-- Requiere: dblink habilitado, schema.sql + data.sql aplicados
-- Password temporal: Admin123! — se re-hashea a bcrypt en primer login
-- ============================================================

CREATE EXTENSION IF NOT EXISTS dblink;

BEGIN;

-- 1. Usuarios
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

-- 2. Áreas de usuarios
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

-- 3. Perfil ADMIN (superusers)
INSERT INTO user_profile (user_id, profile_id)
SELECT u.id, p.id
FROM users u, profiles p
WHERE u.is_superuser = true AND p.code = 'ADMIN' AND u.email != 'admin@seekglobal.co'
ON CONFLICT DO NOTHING;

-- 4. Perfil GESTOR (grupo "Gestor Registro de horas")
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

-- 5. Perfil SEEKER (grupo "Seeker")
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

-- Verificación
SELECT
  COUNT(*) FILTER (WHERE email != 'admin@seekglobal.co') AS usuarios_migrados,
  COUNT(*) FILTER (WHERE is_active = true AND email != 'admin@seekglobal.co') AS activos,
  COUNT(*) FILTER (WHERE is_active = false) AS inactivos
FROM users;
