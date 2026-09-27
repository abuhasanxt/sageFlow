import status from "http-status";
import { MessageRole } from "../../../generated/prisma/enums";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import { streamRAGAnswer } from "./rag.service";


const checkConversation = async (
  userId: string,
  conversationId: string,
) => {
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      userId,
    },
  });

  return conversation;
};

const saveUserMessage = async (
  conversationId: string,
  content: string,
) => {
  const message = await prisma.message.create({
    data: {
      conversationId,
      role: MessageRole.USER,
      content,
      citations: [],
    },
  });

  return message;
};

const saveAssistantMessage = async (
  conversationId: string,
  content: string,
  citations: {
    source: number;
    documentId: string;
    chunkId: string;
    score: number;
  }[],
) => {
  const message = await prisma.message.create({
    data: {
      conversationId,
      role: MessageRole.ASSISTANT,
      content,
      citations: citations.map((citation) =>
        JSON.stringify(citation),
      ),
    },
  });

  return message;
};

const sendMessage = async (
  userId: string,
  conversationId: string,
  content: string,
) => {
  // 1. Check conversation ownership
  const conversation = await checkConversation(
    userId,
    conversationId,
  );

  if (!conversation) {
    throw new AppError(status.NOT_FOUND, "Conversation not found");
  }

  // 2. Save user message
  const userMessage = await saveUserMessage(
    conversationId,
    content,
  );

  return {
    userMessage,
    stream: streamRAGAnswer(userId, content),
  };
};

export const chatApiService = {
  
  checkConversation,
  saveUserMessage,
  saveAssistantMessage,
  sendMessage,
};