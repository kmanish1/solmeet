-- CreateTable
CREATE TABLE "Vote" (
    "id" SERIAL NOT NULL,
    "personId" TEXT NOT NULL,
    "choice" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Vote_personId_key" ON "Vote"("personId");
