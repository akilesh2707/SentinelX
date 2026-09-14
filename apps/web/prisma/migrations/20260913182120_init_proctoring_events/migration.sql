-- CreateEnum
CREATE TYPE "ProctoringEventType" AS ENUM ('TAB_SWITCH', 'WINDOW_BLUR', 'FULLSCREEN_EXIT', 'NETWORK_DISCONNECT', 'NETWORK_RECONNECT', 'PAGE_RELOAD', 'CAMERA_UNAVAILABLE', 'MICROPHONE_UNAVAILABLE', 'EXAM_STARTED', 'EXAM_SUBMITTED');

-- CreateTable
CREATE TABLE "ProctoringEvent" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "eventType" "ProctoringEventType" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "clientTimestamp" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProctoringEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProctoringEvent_attemptId_timestamp_idx" ON "ProctoringEvent"("attemptId", "timestamp");

-- AddForeignKey
ALTER TABLE "ProctoringEvent" ADD CONSTRAINT "ProctoringEvent_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "AssessmentAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
