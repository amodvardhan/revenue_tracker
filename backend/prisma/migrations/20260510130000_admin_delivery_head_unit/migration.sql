-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'admin';

-- AlterTable: add nullable, backfill, then enforce NOT NULL + FK
ALTER TABLE "business_units" ADD COLUMN "delivery_head_user_id" TEXT;

-- Fresh databases create template business units before application bootstrap
-- runs, so the required delivery-head FK needs a deterministic bootstrap user.
INSERT INTO "users" ("id", "email", "password_hash", "role", "name", "created_at", "updated_at")
SELECT
  'demo_delivery_head',
  'delivery.head@demo.com',
  'ff7bd97b1a7789ddd2775122fd6817f3173672da9f802ceec57f284325bf589f',
  'delivery_head'::"UserRole",
  'Delivery Head',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1 FROM "users" WHERE role = 'delivery_head'::"UserRole"
)
ON CONFLICT ("email") DO UPDATE
SET
  "role" = 'delivery_head'::"UserRole",
  "name" = 'Delivery Head',
  "updated_at" = CURRENT_TIMESTAMP;

UPDATE "business_units"
SET "delivery_head_user_id" = (
  SELECT id FROM "users" WHERE role = 'delivery_head'::"UserRole" ORDER BY created_at ASC LIMIT 1
)
WHERE "delivery_head_user_id" IS NULL;

UPDATE "business_units"
SET "delivery_head_user_id" = (
  SELECT id FROM "users" WHERE role = 'delivery_manager'::"UserRole" ORDER BY created_at ASC LIMIT 1
)
WHERE "delivery_head_user_id" IS NULL;

ALTER TABLE "business_units" ALTER COLUMN "delivery_head_user_id" SET NOT NULL;

ALTER TABLE "business_units" ADD CONSTRAINT "business_units_delivery_head_user_id_fkey" FOREIGN KEY ("delivery_head_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
