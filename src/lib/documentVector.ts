import {  generateEmbeddings } from "./embedding";
import { prisma } from "./prisma";
import { qdrant } from "./qdran";

const COLLECTION_NAME = "sageflow_documents";

export const storeDocumentChunks = async (
  documentId: string,
  userId: string,
  chunks: string[],
) => {
  if (!chunks.length) {
    throw new Error("No chunks found");
  }

  const embeddings = await generateEmbeddings(chunks);

  const points = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunkContent = chunks[i];
    const vector = embeddings[i];

    if (!vector || vector.length === 0) {
      throw new Error(
        `Embedding generation failed for chunk ${i}`,
      );
    }

    const existingChunk =
      await prisma.chunk.findUnique({
        where: {
          documentId_chunkIndex: {
            documentId,
            chunkIndex: i,
          },
        },
      });

    const vectorId =
      existingChunk?.vectorId ?? crypto.randomUUID();

    const chunk = await prisma.chunk.upsert({
      where: {
        documentId_chunkIndex: {
          documentId,
          chunkIndex: i,
        },
      },

      update: {
        content: chunkContent,
        tokenCount: chunkContent.split(/\s+/).filter(Boolean)
          .length,
        vectorId,
      },

      create: {
        documentId,
        userId,
        content: chunkContent,
        chunkIndex: i,
        tokenCount: chunkContent.split(/\s+/).filter(Boolean)
          .length,
        vectorId,
      },
    });

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

  await qdrant.upsert(COLLECTION_NAME, {
    wait: true,
    points,
  });

  console.log(
    `${points.length} chunks stored in PostgreSQL`,
  );

  console.log(
    `${points.length} vectors stored in Qdrant`,
  );
};