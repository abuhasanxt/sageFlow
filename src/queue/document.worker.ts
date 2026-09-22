import { Worker } from "bullmq";

import { redisConnection } from "./connection";
import { prisma } from "../lib/prisma";
import { chunkText } from "../lib/chunk";
import { storeDocumentChunks } from "../lib/documentVector";
import { DocumentStatus } from "../../generated/prisma/enums";


export const documentWorker = new Worker(
  "document-Processing",

  async (job) => {
    const { documentId, userId } = job.data;

    console.log("Document job received!");
    console.log("Processing document:", documentId);
    console.log("User:", userId);

    try {
      //  Get document
      const document = await prisma.document.findUnique({
        where: {
          id: documentId,
        },
      });

      if (!document) {
        throw new Error("Document not found");
      }

      //  Get document content
      const text = document.content;

      if (!text?.trim()) {
        throw new Error("Document content is empty");
      }

      //  Chunk document
      const chunks = chunkText(text);

      console.log("Total chunks:", chunks.length);

      //  Generate embeddings + store
      await storeDocumentChunks(
        documentId,
        userId,
        chunks
      );

      //  Mark document as READY
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
    } catch (error) {
      // Mark document as FAILED
      await prisma.document.update({
        where: {
          id: documentId,
        },
        data: {
          status: DocumentStatus.FAILED,
        },
      });

      console.error(
        `Document ${documentId} processing failed`
      );

      throw error;
    }
  },

  {
    connection: redisConnection,
  }
);