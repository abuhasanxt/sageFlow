import { z } from "zod";

export const createDocumentSchema = z.object({
  title: z
    .string("Title is required and must be string")
    .min(2, "Title must be at least 2 characters")
    .max(100, "Title must be at most 100 characters"),

  sourceType: z.enum(["TEXT", "MARKDOWN", "PDF"]),

  content: z.string().optional(),
});

export type CreateDocumentInput = z.infer<
  typeof createDocumentSchema
>;