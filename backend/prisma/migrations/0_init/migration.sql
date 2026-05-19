-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "admin_expenses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "period_id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "description" VARCHAR(255),
    "amount" DECIMAL(14,2) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(50) NOT NULL DEFAULT 'admin',
    "updated_at" TIMESTAMP(6),
    "updated_by" VARCHAR(50),
    "deleted_at" TIMESTAMP(6),
    "deleted_by" VARCHAR(50),
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "admin_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "areas" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(50) NOT NULL DEFAULT 'admin',
    "updated_at" TIMESTAMP(6),
    "updated_by" VARCHAR(50),
    "deleted_at" TIMESTAMP(6),
    "deleted_by" VARCHAR(50),
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_sectors" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(50) NOT NULL DEFAULT 'admin',
    "updated_at" TIMESTAMP(6),
    "updated_by" VARCHAR(50),
    "deleted_at" TIMESTAMP(6),
    "deleted_by" VARCHAR(50),
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "client_sectors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_segmentations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(50) NOT NULL DEFAULT 'admin',
    "updated_at" TIMESTAMP(6),
    "updated_by" VARCHAR(50),
    "deleted_at" TIMESTAMP(6),
    "deleted_by" VARCHAR(50),
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "client_segmentations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "legal_name" VARCHAR(150) NOT NULL,
    "trade_name" VARCHAR(150),
    "ruc" VARCHAR(14) NOT NULL,
    "contact_name" VARCHAR(100),
    "contact_email" VARCHAR(255),
    "phone" VARCHAR(20),
    "address" VARCHAR(200),
    "segmentation_id" UUID NOT NULL,
    "sector_id" UUID,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(50) NOT NULL DEFAULT 'admin',
    "updated_at" TIMESTAMP(6),
    "updated_by" VARCHAR(50),
    "deleted_at" TIMESTAMP(6),
    "deleted_by" VARCHAR(50),
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commercial_records" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "record_date" DATE NOT NULL,
    "project_id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "detail" TEXT,
    "price" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'PEN',
    "document_type_id" UUID,
    "has_contract" BOOLEAN NOT NULL DEFAULT false,
    "is_billed" BOOLEAN NOT NULL DEFAULT false,
    "evidence_filename" VARCHAR(500),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(50) NOT NULL DEFAULT 'admin',
    "updated_at" TIMESTAMP(6),
    "updated_by" VARCHAR(50),
    "deleted_at" TIMESTAMP(6),
    "deleted_by" VARCHAR(50),
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "commercial_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_types" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(50) NOT NULL DEFAULT 'admin',
    "updated_at" TIMESTAMP(6),
    "updated_by" VARCHAR(50),
    "deleted_at" TIMESTAMP(6),
    "deleted_by" VARCHAR(50),
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "document_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hour_projections" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "project_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "work_category_id" UUID,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "projected_hours" DECIMAL(8,1) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(50) NOT NULL DEFAULT 'admin',
    "updated_at" TIMESTAMP(6),
    "updated_by" VARCHAR(50),
    "deleted_at" TIMESTAMP(6),
    "deleted_by" VARCHAR(50),
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "hour_projections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "income_categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(50) NOT NULL DEFAULT 'admin',
    "updated_at" TIMESTAMP(6),
    "updated_by" VARCHAR(50),
    "deleted_at" TIMESTAMP(6),
    "deleted_by" VARCHAR(50),
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "income_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(6) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "periods" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "is_closed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(50) NOT NULL DEFAULT 'admin',
    "updated_at" TIMESTAMP(6),
    "updated_by" VARCHAR(50),
    "deleted_at" TIMESTAMP(6),
    "deleted_by" VARCHAR(50),
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personnel_costs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "period_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "compensation" DECIMAL(14,2) NOT NULL,
    "business_days" INTEGER NOT NULL,
    "hours_per_day" INTEGER NOT NULL DEFAULT 8,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(50) NOT NULL DEFAULT 'admin',
    "updated_at" TIMESTAMP(6),
    "updated_by" VARCHAR(50),
    "deleted_at" TIMESTAMP(6),
    "deleted_by" VARCHAR(50),
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "personnel_costs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productivity_layers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(50) NOT NULL DEFAULT 'admin',
    "updated_at" TIMESTAMP(6),
    "updated_by" VARCHAR(50),
    "deleted_at" TIMESTAMP(6),
    "deleted_by" VARCHAR(50),
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "productivity_layers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(50) NOT NULL DEFAULT 'admin',
    "updated_at" TIMESTAMP(6),
    "updated_by" VARCHAR(50),
    "deleted_at" TIMESTAMP(6),
    "deleted_by" VARCHAR(50),
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(50) NOT NULL DEFAULT 'admin',
    "updated_at" TIMESTAMP(6),
    "updated_by" VARCHAR(50),
    "deleted_at" TIMESTAMP(6),
    "deleted_by" VARCHAR(50),
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "project_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_project_category" (
    "project_id" UUID NOT NULL,
    "project_category_id" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(50) NOT NULL DEFAULT 'admin',

    CONSTRAINT "project_project_category_pkey" PRIMARY KEY ("project_id","project_category_id")
);

-- CreateTable
CREATE TABLE "project_segmentation" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(50) NOT NULL DEFAULT 'admin',
    "updated_at" TIMESTAMP(6),
    "updated_by" VARCHAR(50),
    "deleted_at" TIMESTAMP(6),
    "deleted_by" VARCHAR(50),
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "project_segmentation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_user" (
    "project_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(50) NOT NULL DEFAULT 'admin',
    "updated_at" TIMESTAMP(6),
    "updated_by" VARCHAR(50),
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "project_user_pkey" PRIMARY KEY ("project_id","user_id","role")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "client_id" UUID NOT NULL,
    "project_segmentation_id" UUID NOT NULL,
    "productivity_layer_id" UUID,
    "service_type_id" UUID,
    "area_id" UUID,
    "manager_id" UUID NOT NULL,
    "start_date" DATE,
    "end_date" DATE,
    "actual_start_date" DATE,
    "actual_end_date" DATE,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(50) NOT NULL DEFAULT 'admin',
    "updated_at" TIMESTAMP(6),
    "updated_by" VARCHAR(50),
    "deleted_at" TIMESTAMP(6),
    "deleted_by" VARCHAR(50),
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(6) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revenues" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "project_id" UUID NOT NULL,
    "period_id" UUID NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(50) NOT NULL DEFAULT 'admin',
    "updated_at" TIMESTAMP(6),
    "updated_by" VARCHAR(50),
    "deleted_at" TIMESTAMP(6),
    "deleted_by" VARCHAR(50),
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "revenues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_costs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "period_id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "description" VARCHAR(255),
    "amount" DECIMAL(14,2) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(50) NOT NULL DEFAULT 'admin',
    "updated_at" TIMESTAMP(6),
    "updated_by" VARCHAR(50),
    "deleted_at" TIMESTAMP(6),
    "deleted_by" VARCHAR(50),
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "sales_costs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_types" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(50) NOT NULL DEFAULT 'admin',
    "updated_at" TIMESTAMP(6),
    "updated_by" VARCHAR(50),
    "deleted_at" TIMESTAMP(6),
    "deleted_by" VARCHAR(50),
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "service_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(50) NOT NULL DEFAULT 'admin',
    "updated_at" TIMESTAMP(6),
    "updated_by" VARCHAR(50),
    "deleted_at" TIMESTAMP(6),
    "deleted_by" VARCHAR(50),
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "time_entries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "week" VARCHAR(10) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'PENDIENTE',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(50) NOT NULL DEFAULT 'admin',
    "updated_at" TIMESTAMP(6),
    "updated_by" VARCHAR(50),
    "deleted_at" TIMESTAMP(6),
    "deleted_by" VARCHAR(50),
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "time_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "time_entry_approvals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "time_entry_id" UUID NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "comment" TEXT,
    "suggested_hours" DECIMAL(6,1),
    "suggested_extra_hours" DECIMAL(4,1),
    "rejection_reason" TEXT,
    "can_resubmit" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(50) NOT NULL DEFAULT 'admin',

    CONSTRAINT "time_entry_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "time_entry_lines" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "time_entry_id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "income_category_id" UUID,
    "hours" DECIMAL(6,1) NOT NULL,
    "extra_hours" DECIMAL(4,1) NOT NULL DEFAULT 0,
    "comment" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(50) NOT NULL DEFAULT 'admin',
    "updated_at" TIMESTAMP(6),
    "updated_by" VARCHAR(50),
    "deleted_at" TIMESTAMP(6),
    "deleted_by" VARCHAR(50),
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "time_entry_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_area" (
    "user_id" UUID NOT NULL,
    "area_id" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(50) NOT NULL DEFAULT 'admin',

    CONSTRAINT "user_area_pkey" PRIMARY KEY ("user_id","area_id")
);

-- CreateTable
CREATE TABLE "user_profile" (
    "user_id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(50) NOT NULL DEFAULT 'admin',

    CONSTRAINT "user_profile_pkey" PRIMARY KEY ("user_id","profile_id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL DEFAULT '$placeholder$',
    "document_number" VARCHAR(20) NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "position" VARCHAR(100) NOT NULL,
    "mobile_phone" VARCHAR(20),
    "avatar_url" VARCHAR(500),
    "team_id" UUID NOT NULL,
    "hire_date" DATE NOT NULL,
    "is_staff" BOOLEAN NOT NULL DEFAULT false,
    "is_superuser" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(50) NOT NULL DEFAULT 'admin',
    "updated_at" TIMESTAMP(6),
    "updated_by" VARCHAR(50),
    "deleted_at" TIMESTAMP(6),
    "deleted_by" VARCHAR(50),
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" VARCHAR(50) NOT NULL DEFAULT 'admin',
    "updated_at" TIMESTAMP(6),
    "updated_by" VARCHAR(50),
    "deleted_at" TIMESTAMP(6),
    "deleted_by" VARCHAR(50),
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "work_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_admin_expenses_period_id" ON "admin_expenses"("period_id");

-- CreateIndex
CREATE UNIQUE INDEX "areas_code_key" ON "areas"("code");

-- CreateIndex
CREATE INDEX "idx_areas_code" ON "areas"("code");

-- CreateIndex
CREATE UNIQUE INDEX "client_sectors_code_key" ON "client_sectors"("code");

-- CreateIndex
CREATE INDEX "idx_client_sectors_code" ON "client_sectors"("code");

-- CreateIndex
CREATE UNIQUE INDEX "client_segmentations_code_key" ON "client_segmentations"("code");

-- CreateIndex
CREATE INDEX "idx_client_segmentations_code" ON "client_segmentations"("code");

-- CreateIndex
CREATE UNIQUE INDEX "clients_ruc_key" ON "clients"("ruc");

-- CreateIndex
CREATE INDEX "idx_clients_is_active" ON "clients"("is_active");

-- CreateIndex
CREATE INDEX "idx_clients_ruc" ON "clients"("ruc");

-- CreateIndex
CREATE INDEX "idx_clients_sector_id" ON "clients"("sector_id");

-- CreateIndex
CREATE INDEX "idx_clients_segmentation_id" ON "clients"("segmentation_id");

-- CreateIndex
CREATE INDEX "idx_commercial_records_owner_id" ON "commercial_records"("owner_id");

-- CreateIndex
CREATE INDEX "idx_commercial_records_project_id" ON "commercial_records"("project_id");

-- CreateIndex
CREATE INDEX "idx_commercial_records_record_date" ON "commercial_records"("record_date" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "document_types_name_key" ON "document_types"("name");

-- CreateIndex
CREATE INDEX "idx_hour_projections_dates" ON "hour_projections"("start_date", "end_date");

-- CreateIndex
CREATE INDEX "idx_hour_projections_project_id" ON "hour_projections"("project_id");

-- CreateIndex
CREATE INDEX "idx_hour_projections_project_user" ON "hour_projections"("project_id", "user_id");

-- CreateIndex
CREATE INDEX "idx_hour_projections_user_id" ON "hour_projections"("user_id");

-- CreateIndex
CREATE INDEX "idx_hour_projections_work_category_id" ON "hour_projections"("work_category_id");

-- CreateIndex
CREATE UNIQUE INDEX "income_categories_code_key" ON "income_categories"("code");

-- CreateIndex
CREATE INDEX "idx_income_categories_code" ON "income_categories"("code");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_user_id_key" ON "password_reset_tokens"("user_id");

-- CreateIndex
CREATE INDEX "idx_password_reset_tokens_token" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE INDEX "idx_periods_year" ON "periods"("year");

-- CreateIndex
CREATE INDEX "idx_periods_year_month" ON "periods"("year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "uq_periods_month_year" ON "periods"("month", "year");

-- CreateIndex
CREATE INDEX "idx_personnel_costs_period_id" ON "personnel_costs"("period_id");

-- CreateIndex
CREATE INDEX "idx_personnel_costs_user_id" ON "personnel_costs"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_personnel_costs_period_user" ON "personnel_costs"("period_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "productivity_layers_code_key" ON "productivity_layers"("code");

-- CreateIndex
CREATE INDEX "idx_productivity_layers_code" ON "productivity_layers"("code");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_code_key" ON "profiles"("code");

-- CreateIndex
CREATE INDEX "idx_profiles_code" ON "profiles"("code");

-- CreateIndex
CREATE UNIQUE INDEX "project_categories_code_key" ON "project_categories"("code");

-- CreateIndex
CREATE INDEX "idx_project_categories_code" ON "project_categories"("code");

-- CreateIndex
CREATE INDEX "idx_project_project_category_category_id" ON "project_project_category"("project_category_id");

-- CreateIndex
CREATE INDEX "idx_project_project_category_project_id" ON "project_project_category"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_segmentation_code_key" ON "project_segmentation"("code");

-- CreateIndex
CREATE INDEX "idx_project_segmentation_code" ON "project_segmentation"("code");

-- CreateIndex
CREATE INDEX "idx_project_user_is_active" ON "project_user"("is_active");

-- CreateIndex
CREATE INDEX "idx_project_user_project_id" ON "project_user"("project_id");

-- CreateIndex
CREATE INDEX "idx_project_user_user_id" ON "project_user"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "projects_code_key" ON "projects"("code");

-- CreateIndex
CREATE INDEX "idx_projects_area_id" ON "projects"("area_id");

-- CreateIndex
CREATE INDEX "idx_projects_client_id" ON "projects"("client_id");

-- CreateIndex
CREATE INDEX "idx_projects_code" ON "projects"("code");

-- CreateIndex
CREATE INDEX "idx_projects_is_active" ON "projects"("is_active");

-- CreateIndex
CREATE INDEX "idx_projects_manager_id" ON "projects"("manager_id");

-- CreateIndex
CREATE INDEX "idx_projects_project_segmentation_id" ON "projects"("project_segmentation_id");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_user_id_key" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "idx_refresh_tokens_token" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "idx_revenues_period_id" ON "revenues"("period_id");

-- CreateIndex
CREATE INDEX "idx_revenues_project_id" ON "revenues"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_revenues_project_period" ON "revenues"("project_id", "period_id");

-- CreateIndex
CREATE INDEX "idx_sales_costs_period_id" ON "sales_costs"("period_id");

-- CreateIndex
CREATE UNIQUE INDEX "service_types_code_key" ON "service_types"("code");

-- CreateIndex
CREATE INDEX "idx_service_types_code" ON "service_types"("code");

-- CreateIndex
CREATE UNIQUE INDEX "teams_code_key" ON "teams"("code");

-- CreateIndex
CREATE INDEX "idx_teams_code" ON "teams"("code");

-- CreateIndex
CREATE INDEX "idx_time_entries_status" ON "time_entries"("status");

-- CreateIndex
CREATE INDEX "idx_time_entries_user_id" ON "time_entries"("user_id");

-- CreateIndex
CREATE INDEX "idx_time_entries_user_week" ON "time_entries"("user_id", "week");

-- CreateIndex
CREATE INDEX "idx_time_entries_week" ON "time_entries"("week");

-- CreateIndex
CREATE INDEX "idx_time_entry_approvals_action" ON "time_entry_approvals"("action");

-- CreateIndex
CREATE INDEX "idx_time_entry_approvals_created_at" ON "time_entry_approvals"("created_at");

-- CreateIndex
CREATE INDEX "idx_time_entry_approvals_created_by" ON "time_entry_approvals"("created_by");

-- CreateIndex
CREATE INDEX "idx_time_entry_approvals_time_entry_id" ON "time_entry_approvals"("time_entry_id");

-- CreateIndex
CREATE INDEX "idx_time_entry_lines_project_id" ON "time_entry_lines"("project_id");

-- CreateIndex
CREATE INDEX "idx_time_entry_lines_time_entry_id" ON "time_entry_lines"("time_entry_id");

-- CreateIndex
CREATE INDEX "idx_user_area_area_id" ON "user_area"("area_id");

-- CreateIndex
CREATE INDEX "idx_user_area_user_id" ON "user_area"("user_id");

-- CreateIndex
CREATE INDEX "idx_user_profile_profile_id" ON "user_profile"("profile_id");

-- CreateIndex
CREATE INDEX "idx_user_profile_user_id" ON "user_profile"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_document_number_key" ON "users"("document_number");

-- CreateIndex
CREATE INDEX "idx_users_document_number" ON "users"("document_number");

-- CreateIndex
CREATE INDEX "idx_users_email" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_is_active" ON "users"("is_active");

-- CreateIndex
CREATE INDEX "idx_users_team_id" ON "users"("team_id");

-- CreateIndex
CREATE UNIQUE INDEX "work_categories_code_key" ON "work_categories"("code");

-- CreateIndex
CREATE INDEX "idx_work_categories_code" ON "work_categories"("code");

-- AddForeignKey
ALTER TABLE "admin_expenses" ADD CONSTRAINT "admin_expenses_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "periods"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_sector_id_fkey" FOREIGN KEY ("sector_id") REFERENCES "client_sectors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_segmentation_id_fkey" FOREIGN KEY ("segmentation_id") REFERENCES "client_segmentations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "commercial_records" ADD CONSTRAINT "commercial_records_document_type_id_fkey" FOREIGN KEY ("document_type_id") REFERENCES "document_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "commercial_records" ADD CONSTRAINT "commercial_records_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "commercial_records" ADD CONSTRAINT "commercial_records_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "hour_projections" ADD CONSTRAINT "hour_projections_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "hour_projections" ADD CONSTRAINT "hour_projections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "hour_projections" ADD CONSTRAINT "hour_projections_work_category_id_fkey" FOREIGN KEY ("work_category_id") REFERENCES "work_categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "personnel_costs" ADD CONSTRAINT "personnel_costs_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "periods"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "personnel_costs" ADD CONSTRAINT "personnel_costs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "project_project_category" ADD CONSTRAINT "project_project_category_project_category_id_fkey" FOREIGN KEY ("project_category_id") REFERENCES "project_categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "project_project_category" ADD CONSTRAINT "project_project_category_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "project_user" ADD CONSTRAINT "project_user_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "project_user" ADD CONSTRAINT "project_user_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "areas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_productivity_layer_id_fkey" FOREIGN KEY ("productivity_layer_id") REFERENCES "productivity_layers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_project_segmentation_id_fkey" FOREIGN KEY ("project_segmentation_id") REFERENCES "project_segmentation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_service_type_id_fkey" FOREIGN KEY ("service_type_id") REFERENCES "service_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "revenues" ADD CONSTRAINT "revenues_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "periods"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "revenues" ADD CONSTRAINT "revenues_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sales_costs" ADD CONSTRAINT "sales_costs_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "periods"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "time_entry_approvals" ADD CONSTRAINT "time_entry_approvals_time_entry_id_fkey" FOREIGN KEY ("time_entry_id") REFERENCES "time_entries"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "time_entry_lines" ADD CONSTRAINT "time_entry_lines_income_category_id_fkey" FOREIGN KEY ("income_category_id") REFERENCES "income_categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "time_entry_lines" ADD CONSTRAINT "time_entry_lines_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "time_entry_lines" ADD CONSTRAINT "time_entry_lines_time_entry_id_fkey" FOREIGN KEY ("time_entry_id") REFERENCES "time_entries"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_area" ADD CONSTRAINT "user_area_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "areas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_area" ADD CONSTRAINT "user_area_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_profile" ADD CONSTRAINT "user_profile_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_profile" ADD CONSTRAINT "user_profile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

