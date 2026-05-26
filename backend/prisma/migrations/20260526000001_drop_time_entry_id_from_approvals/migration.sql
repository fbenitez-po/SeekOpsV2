-- drop_time_entry_id_from_approvals
-- time_entry_id is redundant: time_entry_line_id → time_entry_lines.time_entry_id
-- already provides the path to the parent time_entry.

DROP INDEX IF EXISTS "idx_time_entry_approvals_time_entry_id";

ALTER TABLE "time_entry_approvals"
  DROP CONSTRAINT IF EXISTS "time_entry_approvals_time_entry_id_fkey",
  DROP COLUMN IF EXISTS "time_entry_id";
