-- CreateTable
CREATE TABLE "app_settings" (
    "id" TEXT NOT NULL,
    "default_currency_code" TEXT NOT NULL DEFAULT 'EUR',
    "default_revenue_days" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "app_settings" ("id", "default_currency_code", "default_revenue_days", "updated_at")
VALUES ('global', 'EUR', 20, CURRENT_TIMESTAMP);
