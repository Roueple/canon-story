/*
  Warnings:

  - You are about to alter the column `averageRating` on the `Novel` table. The data in that column could be lost. The data in that column will be cast from `Decimal(3,2)` to `DoublePrecision`.

*/
-- AlterTable
ALTER TABLE "Novel" ALTER COLUMN "averageRating" SET DATA TYPE DOUBLE PRECISION;
