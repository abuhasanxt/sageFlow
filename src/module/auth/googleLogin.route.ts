import express from "express"
import { authController } from "./auth.controller"


const router=express.Router()

router.get("/google",authController.googleLogin)
router.get("/google/callback", authController.googleCallback);

export const googleLoginRoutes=router