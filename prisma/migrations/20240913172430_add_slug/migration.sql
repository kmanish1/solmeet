/*
  Warnings:

  - Added the required column `slug` to the `SolMeet` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SolMeet" ADD COLUMN     "slug" TEXT NOT NULL;
