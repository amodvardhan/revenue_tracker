-- Phase 2: business units, accounts, project.accountId, alert.accountId

CREATE TABLE "business_units" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_units_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "business_units_code_key" ON "business_units"("code");

CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "business_unit_id" TEXT NOT NULL,
    "delivery_manager_user_id" TEXT NOT NULL,
    "account_manager_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "accounts_code_key" ON "accounts"("code");

ALTER TABLE "accounts" ADD CONSTRAINT "accounts_business_unit_id_fkey" FOREIGN KEY ("business_unit_id") REFERENCES "business_units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_delivery_manager_user_id_fkey" FOREIGN KEY ("delivery_manager_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_account_manager_user_id_fkey" FOREIGN KEY ("account_manager_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "projects" ADD COLUMN "account_id" TEXT;
ALTER TABLE "alerts" ADD COLUMN "account_id" TEXT;

INSERT INTO "business_units" ("id", "code", "name", "created_at", "updated_at")
VALUES
    ('phase2bu_io', 'IO', 'International Organization', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('phase2bu_gen', 'GEN', 'General', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Legacy projects: one account row per distinct free-text account, under GEN, using first DM/AM users.
INSERT INTO "accounts" ("id", "code", "display_name", "business_unit_id", "delivery_manager_user_id", "account_manager_user_id", "created_at", "updated_at")
SELECT
    'phase2acc_' || SUBSTRING(MD5(TRIM(p."account")), 1, 20),
    UPPER(REGEXP_REPLACE(TRIM(p."account"), '\s+', '_', 'g')),
    TRIM(p."account"),
    (SELECT "id" FROM "business_units" WHERE "code" = 'GEN' LIMIT 1),
    (SELECT "id" FROM "users" WHERE "role" = 'delivery_manager' ORDER BY "created_at" ASC LIMIT 1),
    (SELECT "id" FROM "users" WHERE "role" = 'account_manager' ORDER BY "created_at" ASC LIMIT 1),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM (SELECT DISTINCT "account" FROM "projects") AS p
WHERE TRIM(p."account") <> ''
  AND (SELECT "id" FROM "users" WHERE "role" = 'delivery_manager' ORDER BY "created_at" ASC LIMIT 1) IS NOT NULL
  AND (SELECT "id" FROM "users" WHERE "role" = 'account_manager' ORDER BY "created_at" ASC LIMIT 1) IS NOT NULL;

UPDATE "projects" AS pr
SET "account_id" = a."id"
FROM "accounts" AS a
WHERE pr."account_id" IS NULL
  AND UPPER(REGEXP_REPLACE(TRIM(pr."account"), '\s+', '_', 'g')) = a."code";

UPDATE "projects" AS pr
SET "account_id" = a."id"
FROM "accounts" AS a
WHERE pr."account_id" IS NULL
  AND TRIM(pr."account") = a."display_name";

-- Fallback row if users existed but distinct-account logic missed (should not happen)
INSERT INTO "accounts" ("id", "code", "display_name", "business_unit_id", "delivery_manager_user_id", "account_manager_user_id", "created_at", "updated_at")
SELECT
    'phase2acc_unassigned',
    'UNASSIGNED',
    'Unassigned',
    (SELECT "id" FROM "business_units" WHERE "code" = 'GEN' LIMIT 1),
    (SELECT "id" FROM "users" WHERE "role" = 'delivery_manager' ORDER BY "created_at" ASC LIMIT 1),
    (SELECT "id" FROM "users" WHERE "role" = 'account_manager' ORDER BY "created_at" ASC LIMIT 1),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE EXISTS (SELECT 1 FROM "projects" WHERE "account_id" IS NULL)
  AND NOT EXISTS (SELECT 1 FROM "accounts" WHERE "code" = 'UNASSIGNED')
  AND (SELECT "id" FROM "users" WHERE "role" = 'delivery_manager' ORDER BY "created_at" ASC LIMIT 1) IS NOT NULL
  AND (SELECT "id" FROM "users" WHERE "role" = 'account_manager' ORDER BY "created_at" ASC LIMIT 1) IS NOT NULL;

UPDATE "projects"
SET "account_id" = (SELECT "id" FROM "accounts" WHERE "code" = 'UNASSIGNED' LIMIT 1)
WHERE "account_id" IS NULL;

UPDATE "alerts" AS al
SET "account_id" = a."id"
FROM "accounts" AS a
WHERE al."account_id" IS NULL
  AND UPPER(REGEXP_REPLACE(TRIM(al."account"), '\s+', '_', 'g')) = a."code";

UPDATE "alerts" AS al
SET "account_id" = a."id"
FROM "accounts" AS a
WHERE al."account_id" IS NULL
  AND TRIM(al."account") = a."display_name";

UPDATE "alerts"
SET "account_id" = (SELECT "id" FROM "accounts" ORDER BY "created_at" ASC LIMIT 1)
WHERE "account_id" IS NULL;

ALTER TABLE "projects" DROP COLUMN "account";
ALTER TABLE "projects" ALTER COLUMN "account_id" SET NOT NULL;
ALTER TABLE "projects" ADD CONSTRAINT "projects_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "projects_account_id_idx" ON "projects"("account_id");

ALTER TABLE "alerts" DROP COLUMN "account";
ALTER TABLE "alerts" ALTER COLUMN "account_id" SET NOT NULL;
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

DROP INDEX IF EXISTS "alerts_account_is_active_idx";
CREATE INDEX "alerts_account_id_is_active_idx" ON "alerts"("account_id", "is_active");
