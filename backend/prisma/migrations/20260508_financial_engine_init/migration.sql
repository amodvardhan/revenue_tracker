CREATE TYPE "MonthlyFactStatus" AS ENUM ('blocked', 'provisional', 'final');

CREATE TABLE "monthly_facts" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "compute_key" TEXT NOT NULL,
    "expected_days" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "planned_revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "planned_cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "actual_revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "actual_cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "planned_margin" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "actual_margin" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "margin_variance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "MonthlyFactStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monthly_facts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "monthly_facts_compute_key_key" ON "monthly_facts"("compute_key");
CREATE UNIQUE INDEX "monthly_facts_employee_project_month_key" ON "monthly_facts"("employee_id", "project_id", "month");
