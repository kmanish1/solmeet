/*
  Warnings:

  - Added the required column `username` to the `SolMeet` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SolMeet" ADD COLUMN     "username" TEXT NOT NULL,
ALTER COLUMN "description" DROP NOT NULL;
