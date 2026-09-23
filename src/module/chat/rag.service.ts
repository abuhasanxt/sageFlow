import { AI_CONFIG } from "../../config/ai";
import { openai } from "../../lib/onenai";

import { buildRAGContext, buildRAGPrompt, retrieveRelevantChunks } from "./chat.service";


export const generateRAGAnswer = async (
  userId: string,
  question: string,
) => {
  //  Retrieve relevant chunks
  const chunks = await retrieveRelevantChunks(
    userId,
    question,
  );

  //  No relevant information
  if (chunks.length === 0) {
    return {
      answer:
        "I don't know based on the provided documents.",
      citations: [],
    };
  }

  //  Build context
  const context = buildRAGContext(chunks);

  //  Build prompt
  const prompt = buildRAGPrompt(
    question,
    context,
  );

  //  Ask Claude
  const response = await openai.chat.completions.create({
    model: AI_CONFIG.claudeModel,
    max_tokens: AI_CONFIG.maxTokens,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  //  Extract Claude text
  const answer = response.choices[0]?.message?.content;

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