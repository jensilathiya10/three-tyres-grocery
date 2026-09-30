-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "foodOperator" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "ingredients" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "netQuantity" DOUBLE PRECISION,
ADD COLUMN     "netUnit" TEXT,
ADD COLUMN     "nutrition" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "storage" TEXT NOT NULL DEFAULT '';

