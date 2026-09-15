-- AlterTable
ALTER TABLE "Assessment" ADD COLUMN     "organizerId" TEXT;

-- CreateIndex
CREATE INDEX "Assessment_organizerId_idx" ON "Assessment"("organizerId");

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "Organizer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
