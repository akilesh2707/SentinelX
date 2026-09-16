-- AlterTable
ALTER TABLE "ProctoringEvent" ADD COLUMN     "clientEventId" TEXT;
CREATE UNIQUE INDEX "ProctoringEvent_attemptId_clientEventId_key" ON "ProctoringEvent"("attemptId", "clientEventId");
