import { Worker } from "bullmq";

import { redisConnection } from "./connection";
import { prisma } from "../lib/prisma";
import { chunkText } from "../lib/chunk";
import { storeDocumentChunks } from "../lib/documentVector";
import { DocumentStatus } from "../../generated/prisma/enums";


export const documentWorker = new Worker(
  "document-Processing",

  async (job) => {
    console.log("Document job received!");

    const { documentId, userId } = job.data;

    console.log("Processing document:", documentId);
    console.log("User:", userId);

    // 1. Get document
    const document = await prisma.document.findUnique({
      where: {
        id: documentId,
      },
    });

    if (!document) {
      throw new Error("Document not found");
    }

    // 2. Get document content
    const text = document.content;

    if (!text.trim()) {
      throw new Error("Document content is empty");
    }

    // 3. Chunk document
    const chunks = chunkText(text);

    console.log("Total chunks:", chunks.length);

    // 4. Generate embeddings + store
    await storeDocumentChunks(
      documentId,
      userId,
      chunks
    );
await prisma.document.update({
  where: {
    id: documentId,
  },
  data: {
    status: DocumentStatus.READY,
  },
});
    console.log(
      `Document ${documentId} processed successfully`
    );

    return {
      success: true,
      documentId,
      userId,
      chunks: chunks.length,
    };
  },

  {
    connection: redisConnection,
  }
);

documentWorker.on("completed", (job) => {
  console.log(`Document job ${job.id} completed`);
});

documentWorker.on("failed", (job, error) => {
  console.error("Document job failed", {
    jobId: job?.id,
    documentId: job?.data?.documentId,
    attempt: job?.attemptsMade,
    error: error.message,
  });
});

documentWorker.on("error", (error) => {
  console.error("Document worker error:", error);
});