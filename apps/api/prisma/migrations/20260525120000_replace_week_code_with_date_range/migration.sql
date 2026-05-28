-- DropIndex
DROP INDEX "idx_time_entries_user_week";

-- DropIndex
DROP INDEX "idx_time_entries_week";

-- AlterTable
ALTER TABLE "time_entries" DROP COLUMN "week",
ADD COLUMN     "week_start_date" DATE NOT NULL,
ADD COLUMN     "week_end_date" DATE NOT NULL;

-- CreateIndex
CREATE INDEX "idx_time_entries_user_week_start" ON "time_entries"("user_id", "week_start_date");

-- CreateIndex
CREATE INDEX "idx_time_entries_week_start" ON "time_entries"("week_start_date");

-- CreateIndex
CREATE UNIQUE INDEX "uq_time_entries_user_week_start" ON "time_entries"("user_id", "week_start_date");
