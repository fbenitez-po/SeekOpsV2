-- Data migration: redirect existing time_entry_lines FKs from income_categories to project_categories (same code)
-- Runs only if income_categories still exists (idempotent)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'income_categories') THEN
    UPDATE "time_entry_lines" tel
    SET "income_category_id" = pc.id
    FROM "income_categories" ic
    JOIN "project_categories" pc ON pc.code = ic.code
    WHERE tel."income_category_id" = ic.id;
  END IF;
END $$;

-- DropForeignKey (IF EXISTS — may have been dropped in a previous failed attempt)
ALTER TABLE "time_entry_lines" DROP CONSTRAINT IF EXISTS "time_entry_lines_income_category_id_fkey";

-- DropTable (all constraints and indexes dropped automatically)
DROP TABLE IF EXISTS "income_categories";

-- AddForeignKey
ALTER TABLE "time_entry_lines" ADD CONSTRAINT "time_entry_lines_income_category_id_fkey" FOREIGN KEY ("income_category_id") REFERENCES "project_categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
