import { DocumentStatus } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { documentQueue } from "../../queue/document.queue";
import { CreateDocumentInput } from "./document.validation";

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

export const documentService = {
  createDocument,
};
