-- AlterTable
ALTER TABLE "DeliveryArea" ADD COLUMN     "cutoffHour" INTEGER NOT NULL DEFAULT 20,
ADD COLUMN     "excludedPostcodes" TEXT[] DEFAULT ARRAY[]::TEXT[];

