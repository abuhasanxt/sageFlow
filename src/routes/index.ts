import express from "express";
import { authRoutes } from "../module/auth/auth.route";
import { googleLoginRoutes } from "../module/auth/googleLogin.route";

const router = express.Router();
router.use("/auth", authRoutes);
router.use("/api/auth", googleLoginRoutes);

export const indexRoutes = router;
