import { Request, Response } from "express";

import { conversationService } from "./conversation.service";

import { status } from "http-status";
import { catchAsync } from "../../../shared/catchAsync";
import { sendResponse } from "../../../shared/sendResponse";

const createConversation = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user.userId;
    const { title } = req.body;

    const conversation =
      await conversationService.createConversation(
        userId,
        title,
      );

    sendResponse(res, {
      success: true,
      httpStatusCode: status.CREATED,
      message: "Conversation created successfully",
      data: conversation,
    });
  },
);

const getMyConversations = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user.userId;

    const conversations =
      await conversationService.getMyConversations(userId);

    sendResponse(res, {
      success: true,
      httpStatusCode: status.OK,
      message: "Conversations retrieved successfully",
      data: conversations,
    });
  },
);

export const conversationController = {
  createConversation,
  getMyConversations,
};