-- CreateTable
CREATE TABLE "Assessment" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "mcqCount" INTEGER NOT NULL DEFAULT 0,
    "codingCount" INTEGER NOT NULL DEFAULT 0,
    "totalMarks" INTEGER NOT NULL,
    "passingScore" INTEGER NOT NULL,
    "difficulty" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "maxAttempts" TEXT NOT NULL DEFAULT '1',
    "lateJoin" BOOLEAN NOT NULL DEFAULT true,
    "autoSubmit" BOOLEAN NOT NULL DEFAULT true,
    "randomizeQuestions" BOOLEAN NOT NULL DEFAULT true,
    "negativeMarking" BOOLEAN NOT NULL DEFAULT false,
    "securityLevel" TEXT NOT NULL DEFAULT 'high',
    "identityVerification" BOOLEAN NOT NULL DEFAULT true,
    "primaryCamera" BOOLEAN NOT NULL DEFAULT true,
    "secondaryCamera" BOOLEAN NOT NULL DEFAULT true,
    "browserLock" BOOLEAN NOT NULL DEFAULT true,
    "tabDetection" BOOLEAN NOT NULL DEFAULT true,
    "audioMonitoring" BOOLEAN NOT NULL DEFAULT true,
    "aiProctoring" BOOLEAN NOT NULL DEFAULT true,
    "accessCode" TEXT NOT NULL,
    "joinLink" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Assessment_accessCode_key" ON "Assessment"("accessCode");
