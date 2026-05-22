-- Drop the old index that only covered (time_entry_id, project_id)
-- and would block area projects from having multiple category lines.
DROP INDEX IF EXISTS "idx_time_entry_lines_entry_project_active";

-- Non-area lines: at most one active non-rejected line per (entry, project) when category is NULL
CREATE UNIQUE INDEX "idx_tel_entry_project_no_category"
  ON "time_entry_lines" ("time_entry_id", "project_id")
  WHERE (is_active = true AND status <> 'RECHAZADO' AND income_category_id IS NULL);

-- Area lines: at most one active non-rejected line per (entry, project, category)
CREATE UNIQUE INDEX "idx_tel_entry_project_with_category"
  ON "time_entry_lines" ("time_entry_id", "project_id", "income_category_id")
  WHERE (is_active = true AND status <> 'RECHAZADO' AND income_category_id IS NOT NULL);
