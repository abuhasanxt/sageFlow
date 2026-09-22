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
    const chunkContent = chunks[i];

    //  Generate embedding
    const vector = await generateEmbedding(chunkContent);

    //  Find existing chunk
    const existingChunk = await prisma.chunk.findUnique({
      where: {
        documentId_chunkIndex: {
          documentId,
          chunkIndex: i,
        },
      },
    });

    //  Reuse existing vectorId or create new one
    const vectorId = existingChunk?.vectorId ?? crypto.randomUUID();

    //  Create or update PostgreSQL chunk
    const chunk = await prisma.chunk.upsert({
      where: {
        documentId_chunkIndex: {
          documentId,
          chunkIndex: i,
        },
      },

      update: {
        content: chunkContent,
        tokenCount: chunkContent.split(/\s+/).length,
        vectorId,
      },

      create: {
        documentId,
        userId,
        content: chunkContent,
        chunkIndex: i,
        tokenCount: chunkContent.split(/\s+/).length,
        vectorId,
      },
    });

    //  Prepare Qdrant point
    points.push({
      id: vectorId,
      vector,

      payload: {
        userId,
        documentId,
        chunkId: chunk.id,
      },
    });
  }

  //  Batch upsert into Qdrant
  await qdrant.upsert(COLLECTION_NAME, {
    wait: true,
    points,
  });

  console.log(`${points.length} chunks stored in PostgreSQL`);
  console.log(`${points.length} vectors stored in Qdrant`);
};