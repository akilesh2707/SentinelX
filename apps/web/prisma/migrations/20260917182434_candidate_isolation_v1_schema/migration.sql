-- AlterTable
ALTER TABLE "Candidate" ADD COLUMN     "organizerId" TEXT;

-- AddForeignKey
ALTER TABLE "Candidate" ADD CONSTRAINT "Candidate_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "Organizer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
