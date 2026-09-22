import status from "http-status";
import { DocumentStatus } from "../../../generated/prisma/enums";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import { documentQueue } from "../../queue/document.queue";
import { CreateDocumentInput } from "./document.validation";
import { qdrant } from "../../lib/qdran";

const createDocument = async (userId: string, payload: CreateDocumentInput) => {
  const document = await prisma.document.create({
    data: {
      userId,
      title: payload.title,
      content: payload.content,
      sourceType: payload.sourceType,
      status: DocumentStatus.PROCESSING,
    },
  });
  await documentQueue.add("process-document", {
    documentId: document.id,
    userId,
  });
  return document;
};

const COLLECTION_NAME = "sageflow_documents";
export const deleteDocument = async (id: string, userId: string) => {
  const document = await prisma.document.findFirst({
    where: {
      id,
      userId,
    },
    include: {
      chunks: true,
    },
  });

  if (!document) {
    throw new AppError(status.NOT_FOUND, "Document not found");
  }

  // Delete vectors from Qdrant
  if (document.chunks.length > 0) {
    const vectorIds = document.chunks
      .map((chunk) => chunk.vectorId)
      .filter(Boolean);

    if (vectorIds.length > 0) {
      await qdrant.delete(COLLECTION_NAME, {
        wait: true,
        points: vectorIds,
      });
    }
  }

  // Delete document
  await prisma.document.delete({
    where: {
      id: id,
    },
  });

  return document;
};
export const documentService = {
  createDocument,
  deleteDocument,
};
