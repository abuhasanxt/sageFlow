
import { generateEmbedding } from "./embedding";
import { prisma } from "./prisma";
import { qdrant } from "./qdran";

const COLLECTION_NAME = "sageflow_documents";

export const storeDocumentChunks = async (
  documentId: string,
  userId: string,
  chunks: string[]
) => {
  const points = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];

    const vector = await generateEmbedding(chunk);

    const vectorId = crypto.randomUUID();

    points.push({
      id: vectorId,
      vector,

      payload: {
        documentId,
        userId,
        chunk,
        chunkIndex: i,
      },
    });

    await prisma.chunk.create({
      data: {
        documentId,
        userId,
        content: chunk,
        chunkIndex: i,
        tokenCount: chunk.split(/\s+/).length,
        vectorId,
      },
    });
  }

  await qdrant.upsert(COLLECTION_NAME, {
    wait: true,
    points,
  });

  console.log(`${points.length} chunks stored in Qdrant`);
  console.log(`${points.length} chunks stored in PostgreSQL`);
};