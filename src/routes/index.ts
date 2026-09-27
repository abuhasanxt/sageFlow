import express from "express";
import { authRoutes } from "../module/auth/auth.route";
import { googleLoginRoutes } from "../module/auth/googleLogin.route";
import { healthRoutes } from "./health.route";
import { documentRoutes } from "../module/document/document.route";
import { conversationRoutes } from "../module/chat/conversation/conversation.route";
import { chatRoutes } from "../module/chat/chat.route";

const router = express.Router();
router.use("/",healthRoutes)
router.use("/auth", authRoutes);
router.use("/api/auth", googleLoginRoutes);
router.use("/documents",documentRoutes)
router.use("/conversations",conversationRoutes)
router.use("/",chatRoutes)

export const indexRoutes = router;
