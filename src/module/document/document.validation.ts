import { z } from "zod";

export const createDocumentSchema = z.object({
  title: z
    .string("Title is required and must be string")
    .min(2, "Title must be at least 2 characters"),

  content: z
    .string("Content is required and must be string")
    .min(2, "Content must be at least 2 characters"),

  sourceType: z.enum(["TEXT", "MARKDOWN", "PDF"]),
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
