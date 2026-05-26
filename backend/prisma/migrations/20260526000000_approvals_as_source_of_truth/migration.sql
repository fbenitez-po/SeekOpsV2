-- approvals_as_source_of_truth
-- Move review state from time_entry_lines/time_entries into time_entry_approvals.
-- time_entry_lines becomes an immutable record of what the seeker loaded.
-- time_entry_approvals gets one PENDIENTE row per line at load time,
-- mutated to APROBADO / APROBADO_CON_OBSERVACION / RECHAZADO by the gestor.

-- 1. Drop status from time_entries
DROP INDEX IF EXISTS "idx_time_entries_status";
ALTER TABLE "time_entries" DROP COLUMN IF EXISTS "status";

-- 2. Drop status, reviewed_by, reviewed_at from time_entry_lines
DROP INDEX IF EXISTS "idx_time_entry_lines_status";
ALTER TABLE "time_entry_lines"
  DROP COLUMN IF EXISTS "status",
  DROP COLUMN IF EXISTS "reviewed_by",
  DROP COLUMN IF EXISTS "reviewed_at";

-- 3. Evolve time_entry_approvals
-- 3a. Rename action → status
ALTER TABLE "time_entry_approvals" RENAME COLUMN "action" TO "status";
ALTER TABLE "time_entry_approvals" ALTER COLUMN "status" SET DEFAULT 'PENDIENTE';

-- 3b. Add time_entry_line_id (nullable first to allow backfill on non-empty DBs)
ALTER TABLE "time_entry_approvals" ADD COLUMN "time_entry_line_id" UUID;

-- 3c. Add reviewed_by / reviewed_at
ALTER TABLE "time_entry_approvals"
  ADD COLUMN "reviewed_by" VARCHAR(50),
  ADD COLUMN "reviewed_at" TIMESTAMP(6);

-- 3d. Change can_resubmit default to false
ALTER TABLE "time_entry_approvals" ALTER COLUMN "can_resubmit" SET DEFAULT false;

-- 3e. Add FK constraint (only meaningful rows on non-empty DBs; safe on empty)
ALTER TABLE "time_entry_approvals"
  ADD CONSTRAINT "time_entry_approvals_time_entry_line_id_fkey"
  FOREIGN KEY ("time_entry_line_id") REFERENCES "time_entry_lines"("id")
  ON DELETE CASCADE ON UPDATE NO ACTION
  DEFERRABLE INITIALLY DEFERRED;

-- 3f. Add UNIQUE constraint (1:1 line→approval)
ALTER TABLE "time_entry_approvals"
  ADD CONSTRAINT "time_entry_approvals_time_entry_line_id_key" UNIQUE ("time_entry_line_id");

-- 3g. Indexes
DROP INDEX IF EXISTS "idx_time_entry_approvals_action";
CREATE INDEX "idx_time_entry_approvals_status"  ON "time_entry_approvals"("status");
CREATE INDEX "idx_time_entry_approvals_line_id" ON "time_entry_approvals"("time_entry_line_id");
