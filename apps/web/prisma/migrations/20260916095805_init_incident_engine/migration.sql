-- CreateEnum
CREATE TYPE "IncidentType" AS ENUM ('TAB_SWITCH', 'WINDOW_BLUR', 'FULLSCREEN_EXIT', 'PAGE_RELOAD', 'CAMERA_UNAVAILABLE', 'MICROPHONE_UNAVAILABLE', 'NETWORK_DISCONNECT');

-- CreateEnum
CREATE TYPE "IncidentSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('UNRESOLVED', 'REVIEWED', 'DISMISSED');

-- AlterTable
ALTER TABLE "AssessmentAttempt" ADD COLUMN     "riskScore" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Incident" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "type" "IncidentType" NOT NULL,
    "severity" "IncidentSeverity" NOT NULL,
    "status" "IncidentStatus" NOT NULL DEFAULT 'UNRESOLVED',
    "firstSeen" TIMESTAMP(3) NOT NULL,
    "lastSeen" TIMESTAMP(3) NOT NULL,
    "eventCount" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentEvent" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "proctoringEventId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncidentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Incident_attemptId_idx" ON "Incident"("attemptId");

-- CreateIndex
CREATE INDEX "Incident_attemptId_type_idx" ON "Incident"("attemptId", "type");

-- CreateIndex
CREATE INDEX "Incident_attemptId_status_idx" ON "Incident"("attemptId", "status");

-- CreateIndex
CREATE INDEX "IncidentEvent_incidentId_idx" ON "IncidentEvent"("incidentId");

-- CreateIndex
CREATE UNIQUE INDEX "IncidentEvent_incidentId_proctoringEventId_key" ON "IncidentEvent"("incidentId", "proctoringEventId");

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "AssessmentAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentEvent" ADD CONSTRAINT "IncidentEvent_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentEvent" ADD CONSTRAINT "IncidentEvent_proctoringEventId_fkey" FOREIGN KEY ("proctoringEventId") REFERENCES "ProctoringEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
