import express from "express";
import { checkAuth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { validateRequest } from "../../middleware/validateRequest";
import { createDocumentSchema } from "./document.validation";
import { documentController } from "./document.controller";

const router = express.Router();

router.post(
  "/",
  checkAuth(Role.USER),
  validateRequest(createDocumentSchema),
  documentController.createDocument,
);

export const documentRoutes=router