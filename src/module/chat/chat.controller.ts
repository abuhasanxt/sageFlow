import { Request, Response } from "express";

import { chatApiService } from "./chat.api.service";
import { status } from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";

const sendMessage = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user.userId;
    const conversationId = req.params.id;
    const { content } = req.body;

    // Validate content
    if (
      typeof content !== "string" ||
      content.trim().length === 0
    ) {
      return res.status(status.BAD_REQUEST).json({
        success: false,
        message: "Message content is required",
      });
    }

    // 1. Verify conversation and save user message
    const result = await chatApiService.sendMessage(
      userId,
      conversationId as string,
      content.trim(),
    );

    // 2. Set SSE headers
    res.setHeader(
      "Content-Type",
      "text/event-stream",
    );
    res.setHeader(
      "Cache-Control",
      "no-cache, no-transform",
    );
    res.setHeader("Connection", "keep-alive");

    res.flushHeaders();

    let fullAnswer = "";

    let citations: {
      source: number;
      documentId: string;
      chunkId: string;
      score: number;
    }[] = [];

    try {
      // 3. Stream RAG answer
      for await (const event of result.stream) {
        if (res.writableEnded) {
          break;
        }

        if (event.type === "text") {
          fullAnswer += event.content;

          res.write(
            `data: ${JSON.stringify({
              type: "text",
              content: event.content,
            })}\n\n`,
          );
        }

        if (event.type === "citations") {
          citations = event.citations ?? [];

          res.write(
            `data: ${JSON.stringify({
              type: "citations",
              citations: event.citations,
            })}\n\n`,
          );
        }
      }

      // 4. Save assistant response
      if (!res.writableEnded) {
        const assistantMessage =
          await chatApiService.saveAssistantMessage(
            conversationId as string,
            fullAnswer,
            citations,
          );

        // 5. Send completed event
        res.write(
          `data: ${JSON.stringify({
            type: "done",
            messageId: assistantMessage.id,
          })}\n\n`,
        );

        res.end();
      }
    } catch (error) {
        console.error("Error generating RAG answer:", error);
      if (!res.writableEnded) {
        res.write(
          `data: ${JSON.stringify({
            type: "error",
            message: "Failed to generate answer",
          })}\n\n`,
        );

        res.end();
      }
    }
  },
);
const getConversationById = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user.userId;
    const { id } = req.params;

    const result =
      await chatApiService.getConversationById(
        userId,
        id as string,
      );

    sendResponse(res, {
      success: true,
      httpStatusCode:status.OK,
      message: "Conversation retrieved successfully",
      data: result,
    });
  },
);
export const chatController = {
  sendMessage,
  getConversationById
};