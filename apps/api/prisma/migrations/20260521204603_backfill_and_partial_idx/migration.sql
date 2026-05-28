-- Backfill: propagate time_entries.status to each of its lines
UPDATE time_entry_lines tel
SET status = te.status
FROM time_entries te
WHERE tel.time_entry_id = te.id;

-- Backfill: set project_id on historical approvals where derivable
-- (only for entries with a single distinct project; multi-project entries left NULL)
UPDATE time_entry_approvals tea
SET project_id = subq.project_id
FROM (
  SELECT tel.time_entry_id, (array_agg(DISTINCT tel.project_id))[1] AS project_id
  FROM time_entry_lines tel
  GROUP BY tel.time_entry_id
  HAVING COUNT(DISTINCT tel.project_id) = 1
) subq
WHERE tea.time_entry_id = subq.time_entry_id
  AND tea.project_id IS NULL;

-- Partial unique index: at most one active non-rejected line per (entry, project)
CREATE UNIQUE INDEX "idx_time_entry_lines_entry_project_active"
  ON "time_entry_lines" ("time_entry_id", "project_id")
  WHERE (is_active = true AND status <> 'RECHAZADO');