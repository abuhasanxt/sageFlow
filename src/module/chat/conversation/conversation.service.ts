import { prisma } from "../../../lib/prisma";


const createConversation = async (
  userId: string,
  title?: string,
) => {
  const conversation = await prisma.conversation.create({
    data: {
      userId,
      title: title?.trim() || "New Conversation",
    },
  });

  return conversation;
};

const getMyConversations = async (userId: string) => {
  return prisma.conversation.findMany({
    where: {
      userId,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });
};

export const conversationService = {
  createConversation,
  getMyConversations,
};