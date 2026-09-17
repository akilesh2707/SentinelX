/*
  Warnings:

  - Made the column `organizerId` on table `Candidate` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Candidate" ALTER COLUMN "organizerId" SET NOT NULL;
