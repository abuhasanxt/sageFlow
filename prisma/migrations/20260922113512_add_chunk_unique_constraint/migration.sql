/*
  Warnings:

  - A unique constraint covering the columns `[documentId,chunkIndex]` on the table `Chunk` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Chunk_documentId_chunkIndex_key" ON "Chunk"("documentId", "chunkIndex");
