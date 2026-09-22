import { AI_CONFIG } from "../../config/ai";
import { anthropic } from "../../lib/anthropic";
import { buildRAGContext, buildRAGPrompt, retrieveRelevantChunks } from "./chat.service";


export const generateRAGAnswer = async (
  userId: string,
  question: string,
) => {
  // 1. Retrieve relevant chunks
  const chunks = await retrieveRelevantChunks(
    userId,
    question,
  );

  // 2. No relevant information
  if (chunks.length === 0) {
    return {
      answer:
        "I don't know based on the provided documents.",
      citations: [],
    };
  }

  // 3. Build context
  const context = buildRAGContext(chunks);

  // 4. Build prompt
  const prompt = buildRAGPrompt(
    question,
    context,
  );

  // 5. Ask Claude
  const response = await anthropic.messages.create({
    model: AI_CONFIG.claudeModel,
    max_tokens: AI_CONFIG.maxTokens,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  // 6. Extract Claude text
  const answer = response.content
    .filter(
      (item) => item.type === "text",
    )
    .map((item) => item.text)
    .join("\n");

  return {
    answer,
    citations: chunks.map((chunk, index) => ({
      source: index + 1,
      documentId: chunk.documentId,
      chunkId: chunk.chunkId,
      score: chunk.score,
    })),
  };
};