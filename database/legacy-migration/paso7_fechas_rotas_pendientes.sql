-- ============================================================
-- PASO 7 — Pendientes: heads de horas con rango de fechas ROTO
--
-- Estas cabeceras NO se migraron en el Paso 7 porque su rango de
-- fechas es inválido (date_end < date_init, o span > 7 días, o
-- date_init/date_end NULL). Se listan aquí para corregirlas a mano
-- en el origen y luego re-ejecutar el Paso 7 (es idempotente).
--
-- Ejecutar contra la BD vieja:
--   docker exec -i seekops-db psql -U postgres -d seekops_old \
--     -f - < .ai/db/migration-seekops-old/paso7_fechas_rotas_pendientes.sql
--
-- Para exportar a CSV:
--   docker exec seekops-db psql -U postgres -d seekops_old -c "\copy (
--     <el SELECT de abajo>
--   ) TO STDOUT WITH CSV HEADER" > paso7_fechas_rotas_pendientes.csv
-- ============================================================

SELECT
  h.id                              AS head_id,
  h.user_id,
  uu.email,
  h.date_init,
  h.date_end,
  (h.date_end - h.date_init)        AS span_days,
  CASE
    WHEN h.date_init IS NULL OR h.date_end IS NULL THEN 'fecha NULL'
    WHEN h.date_end < h.date_init                  THEN 'rango invertido'
    WHEN (h.date_end - h.date_init) > 7            THEN 'span > 7 días'
  END                               AS motivo,
  h.status                          AS head_status,
  l.id                              AS line_id,
  l.project_id,
  pp.code                           AS project_code,
  l.hours,
  l.extra_hours,
  l.validated_hours,
  l.validated_extra_hours,
  l.status                          AS line_status,
  l.category_extension_id,
  l.description,
  l.justification
FROM seekers_hoursworkedhead h
JOIN users_user uu              ON uu.id = h.user_id
LEFT JOIN seekers_hoursworked l ON l.head_id = h.id
LEFT JOIN projects_project pp   ON pp.id = l.project_id
WHERE h.date_init IS NULL
   OR h.date_end IS NULL
   OR h.date_end < h.date_init
   OR (h.date_end - h.date_init) > 7
ORDER BY uu.email, h.date_init, h.id, l.project_id;

-- Resumen: cantidad de heads y líneas afectadas
SELECT
  COUNT(DISTINCT h.id)  AS heads_afectadas,
  COUNT(l.id)           AS lineas_afectadas
FROM seekers_hoursworkedhead h
LEFT JOIN seekers_hoursworked l ON l.head_id = h.id
WHERE h.date_init IS NULL
   OR h.date_end IS NULL
   OR h.date_end < h.date_init
   OR (h.date_end - h.date_init) > 7;
