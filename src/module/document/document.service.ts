import { DocumentStatus } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { CreateDocumentInput } from "./document.validation";

const createDocument = async (userId: string, payload: CreateDocumentInput) => {
  const document = await prisma.document.create({
    data: {
      userId,
      title:payload.title,
      sourceType:payload.sourceType,
      status:DocumentStatus.PROCESSING
    },
  });
  return document
};

export const documentService={
    createDocument
}
