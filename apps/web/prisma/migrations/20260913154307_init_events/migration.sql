-- AlterTable
ALTER TABLE "Assessment" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventAssessment" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EventAssessment_eventId_idx" ON "EventAssessment"("eventId");

-- CreateIndex
CREATE INDEX "EventAssessment_assessmentId_idx" ON "EventAssessment"("assessmentId");

-- CreateIndex
CREATE UNIQUE INDEX "EventAssessment_eventId_assessmentId_key" ON "EventAssessment"("eventId", "assessmentId");

-- AddForeignKey
ALTER TABLE "EventAssessment" ADD CONSTRAINT "EventAssessment_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventAssessment" ADD CONSTRAINT "EventAssessment_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
