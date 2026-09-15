/*
  Warnings:

  - Made the column `organizerId` on table `Assessment` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Assessment" ALTER COLUMN "organizerId" SET NOT NULL;
