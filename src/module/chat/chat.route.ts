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

export const chatRoutes = router;