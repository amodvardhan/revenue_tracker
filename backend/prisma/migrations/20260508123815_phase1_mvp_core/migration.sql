/*
  Warnings:

  - Added the required column `assignment_id` to the `monthly_facts` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('delivery_manager', 'account_manager', 'project_manager', 'delivery_head');

-- CreateEnum
CREATE TYPE "ProjectionStatus" AS ENUM ('projected', 'converted');

-- AlterTable
ALTER TABLE "monthly_facts" ADD COLUMN     "assignment_id" TEXT NOT NULL,
ADD COLUMN     "projected_revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "signed_revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "total_revenue" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_login_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "project_name" TEXT NOT NULL,
    "client_name" TEXT NOT NULL,
    "account" TEXT NOT NULL,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignments" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "team_member_name" TEXT NOT NULL,
    "allocation_percent" DOUBLE PRECISION NOT NULL,
    "daily_rate" DOUBLE PRECISION NOT NULL,
    "signed_start_date" TIMESTAMP(3) NOT NULL,
    "signed_end_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance" (
    "id" TEXT NOT NULL,
    "assignment_id" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "actual_days" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_revisions" (
    "id" TEXT NOT NULL,
    "assignment_id" TEXT NOT NULL,
    "effective_date" TIMESTAMP(3) NOT NULL,
    "old_rate" DOUBLE PRECISION NOT NULL,
    "new_rate" DOUBLE PRECISION NOT NULL,
    "authorizer_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rate_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projections" (
    "id" TEXT NOT NULL,
    "assignment_id" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "projection_rate" DOUBLE PRECISION NOT NULL,
    "status" "ProjectionStatus" NOT NULL DEFAULT 'projected',
    "converted_at" TIMESTAMP(3),
    "converted_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL,
    "account" TEXT NOT NULL,
    "alert_type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "triggered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "triggered_by_id" TEXT,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "projects_project_name_key" ON "projects"("project_name");

-- CreateIndex
CREATE INDEX "assignments_project_id_idx" ON "assignments"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_assignment_month_key" ON "attendance"("assignment_id", "month");

-- CreateIndex
CREATE INDEX "rate_revisions_assignment_id_effective_date_idx" ON "rate_revisions"("assignment_id", "effective_date");

-- CreateIndex
CREATE INDEX "projections_assignment_id_idx" ON "projections"("assignment_id");

-- CreateIndex
CREATE INDEX "alerts_account_is_active_idx" ON "alerts"("account", "is_active");

-- AddForeignKey
ALTER TABLE "monthly_facts" ADD CONSTRAINT "monthly_facts_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rate_revisions" ADD CONSTRAINT "rate_revisions_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rate_revisions" ADD CONSTRAINT "rate_revisions_authorizer_id_fkey" FOREIGN KEY ("authorizer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projections" ADD CONSTRAINT "projections_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projections" ADD CONSTRAINT "projections_converted_by_user_id_fkey" FOREIGN KEY ("converted_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_triggered_by_id_fkey" FOREIGN KEY ("triggered_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
