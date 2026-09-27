import status from "http-status";
import { MessageRole } from "../../../generated/prisma/enums";
import AppError from "../../errorHelpers/AppError";
import { prisma } from "../../lib/prisma";
import { streamRAGAnswer } from "./rag.service";

const checkConversation = async (userId: string, conversationId: string) => {
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      userId,
    },
  });

  return conversation;
};

const saveUserMessage = async (conversationId: string, content: string) => {
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
      citations: citations.map((citation) => JSON.stringify(citation)),
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
  const conversation = await checkConversation(userId, conversationId);

  if (!conversation) {
    throw new AppError(status.NOT_FOUND, "Conversation not found");
  }
  //  Fetch previous conversation history
  const previousMessages = await prisma.message.findMany({
    where: {
      conversationId,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
  });
  // Reverse to maintain chronological order
  const history = previousMessages.reverse().map((message) => ({
    role: message.role,
    content: message.content,
  }));
  // 2. Save user message
  const userMessage = await saveUserMessage(conversationId, content);
  // 4. Start RAG stream with conversation history

  const stream = streamRAGAnswer(userId, content, history);
  return {
    userMessage,
    stream,
  };
};

const getConversationById = async (
  userId: string,
  conversationId: string,
) => {
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      userId,
    },
    include: {
      messages: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!conversation) {
    throw new AppError(
      status.NOT_FOUND,
      "Conversation not found",
    );
  }

  return {
    ...conversation,
    messages: conversation.messages.map((message) => ({
      ...message,
      citations: message.citations.map((citation) =>
        JSON.parse(citation),
      ),
    })),
  };
};

export const chatApiService = {
  checkConversation,
  saveUserMessage,
  saveAssistantMessage,
  sendMessage,
  getConversationById
};
