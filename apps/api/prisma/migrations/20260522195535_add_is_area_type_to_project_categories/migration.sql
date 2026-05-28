-- AlterTable
ALTER TABLE "project_categories" ADD COLUMN     "is_area_type" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "idx_project_categories_is_area_type" ON "project_categories"("is_area_type");
