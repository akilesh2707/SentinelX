-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "IncidentType" ADD VALUE 'AI_NO_FACE';
ALTER TYPE "IncidentType" ADD VALUE 'AI_MULTIPLE_FACES';
ALTER TYPE "IncidentType" ADD VALUE 'AI_LOOKING_AWAY';
ALTER TYPE "IncidentType" ADD VALUE 'AI_CAMERA_OBSTRUCTED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ProctoringEventType" ADD VALUE 'AI_NO_FACE';
ALTER TYPE "ProctoringEventType" ADD VALUE 'AI_MULTIPLE_FACES';
ALTER TYPE "ProctoringEventType" ADD VALUE 'AI_LOOKING_AWAY';
ALTER TYPE "ProctoringEventType" ADD VALUE 'AI_CAMERA_OBSTRUCTED';
