import { Router } from "express";
import { conversationController } from "./conversation.controller";
import { checkAuth } from "../../../middleware/checkAuth";
import { Role } from "../../../../generated/prisma/enums";

const router = Router();

router.post(
  "/",
  checkAuth(Role.USER),
  conversationController.createConversation,
);

router.get(
  "/",
  checkAuth(Role.USER),
  conversationController.getMyConversations,
);

export const conversationRoutes = router;