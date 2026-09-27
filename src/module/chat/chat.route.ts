import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { chatController } from "./chat.controller";


const router = Router();

router.post(
  "/conversations/:id/messages",
  checkAuth(Role.USER),
  chatController.sendMessage,
);
router.get(
  "/conversations/:id",
  checkAuth(Role.USER),
  chatController.getConversationById,
);
export const chatRoutes = router;