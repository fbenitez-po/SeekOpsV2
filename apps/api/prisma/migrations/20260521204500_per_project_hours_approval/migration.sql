-- AlterTable
ALTER TABLE "time_entry_approvals" ADD COLUMN     "project_id" UUID;

-- AlterTable
ALTER TABLE "time_entry_lines" ADD COLUMN     "reviewed_at" TIMESTAMP(6),
ADD COLUMN     "reviewed_by" VARCHAR(50),
ADD COLUMN     "status" VARCHAR(50) NOT NULL DEFAULT 'PENDIENTE';

-- CreateIndex
CREATE INDEX "idx_time_entry_approvals_project_id" ON "time_entry_approvals"("project_id");

-- CreateIndex
CREATE INDEX "idx_time_entry_lines_status" ON "time_entry_lines"("status");

-- AddForeignKey
ALTER TABLE "time_entry_approvals" ADD CONSTRAINT "time_entry_approvals_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
