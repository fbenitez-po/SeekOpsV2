-- Drop redundant columns from time_entry_approvals
-- rejection_reason: unified into comment (already written there on reject)
-- can_resubmit: re-submission determined by RECHAZADO status, not this field
-- project_id: reachable via time_entry_line_id → time_entry_lines.project_id

ALTER TABLE "time_entry_approvals" DROP COLUMN IF EXISTS "rejection_reason";
ALTER TABLE "time_entry_approvals" DROP COLUMN IF EXISTS "can_resubmit";
ALTER TABLE "time_entry_approvals" DROP COLUMN IF EXISTS "project_id";
DROP INDEX IF EXISTS "idx_time_entry_approvals_project_id";
