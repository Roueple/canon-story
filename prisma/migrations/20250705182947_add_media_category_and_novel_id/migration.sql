-- AlterTable
ALTER TABLE "MediaFile" ADD COLUMN     "category" TEXT,
ADD COLUMN     "novelId" TEXT;

-- CreateIndex
CREATE INDEX "MediaFile_novelId_category_idx" ON "MediaFile"("novelId", "category");

-- AddForeignKey
ALTER TABLE "MediaFile" ADD CONSTRAINT "MediaFile_novelId_fkey" FOREIGN KEY ("novelId") REFERENCES "Novel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
