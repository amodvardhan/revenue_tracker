-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'admin';

-- AlterTable: add nullable, backfill, then enforce NOT NULL + FK
ALTER TABLE "business_units" ADD COLUMN "delivery_head_user_id" TEXT;

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
