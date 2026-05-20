-- AlterTable
ALTER TABLE "projects" ALTER COLUMN "name" SET DATA TYPE VARCHAR(200),
ALTER COLUMN "project_segmentation_id" DROP NOT NULL,
ALTER COLUMN "manager_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "document_number" DROP NOT NULL,
ALTER COLUMN "position" DROP NOT NULL,
ALTER COLUMN "team_id" DROP NOT NULL,
ALTER COLUMN "hire_date" DROP NOT NULL;
