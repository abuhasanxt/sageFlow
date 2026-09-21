import express from "express"
import { authController } from "./auth.controller"
import { checkAuth } from "../../middleware/checkAuth"
import { Role } from "../../../generated/prisma/enums"
import { multerUpload } from "../../config/multer.config"
import { validateRequest } from "../../middleware/validateRequest"
import { emailVerifyZodSchema, userLoginZodSchema, userRegisterZodSchema, userUpdateZodSchema } from "./auth.validation"

const router=express.Router()
router.post("/register", validateRequest(userRegisterZodSchema),authController.register)
router.post("/login", validateRequest(userLoginZodSchema),authController.login)
router.post("/email-verify",validateRequest(emailVerifyZodSchema),authController.verifyEmail)
router.post("/refresh",authController.getNewToken)
router.post("/logout",checkAuth(),authController.logout)
router.get("/me",checkAuth(Role.USER,Role.ADMIN), authController.getMe)
router.patch("/me",checkAuth(),multerUpload.single("image"),validateRequest(userUpdateZodSchema),authController.updateMe)
router.delete("/me",checkAuth(),authController.deleteMe)

export const authRoutes=router