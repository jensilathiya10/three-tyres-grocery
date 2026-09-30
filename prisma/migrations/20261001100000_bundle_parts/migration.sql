-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "bundlePartIds" TEXT[] DEFAULT ARRAY[]::TEXT[];

