import { AI_CONFIG } from "../../config/ai";
import { openai } from "../../lib/onenai";

import {
  buildRAGContext,
  buildRAGPrompt,
  ChatHistory,
  retrieveRelevantChunks,
} from "./chat.service";

const UNKNOWN_ANSWER = "I don't know based on the provided documents.";
export const generateRAGAnswer = async (userId: string, question: string) => {
  //  Retrieve relevant chunks
  const chunks = await retrieveRelevantChunks(userId, question);

  //  No relevant information
  if (chunks.length === 0) {
    return {
      answer: UNKNOWN_ANSWER,
      citations: [],
    };
  }

  //  Build context
  const context = buildRAGContext(chunks);

  //  Build prompt
  const prompt = buildRAGPrompt(question, context);

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
  const rawAnswer = response.choices[0]?.message?.content;
  if (!rawAnswer || typeof rawAnswer !== "string") {
    return {
      answer: UNKNOWN_ANSWER,
      citations: [],
    };
  }
  const answer = rawAnswer.trim();
  if (answer.includes(UNKNOWN_ANSWER)) {
    return {
      answer: UNKNOWN_ANSWER,
      citations: [],
    };
  }
  //extract cited sources number
  const sourceNumbers = [
    ...new Set(
      [...answer.matchAll(/\[Source\s+(\d+)\]/g)].map((match) =>
        Number(match[1]),
      ),
    ),
  ];

  //Validate source numbers
  const validSources = sourceNumbers.filter(
    (source) =>
      Number.isInteger(source) && source >= 1 && source <= chunks.length,
  );

  //no valid citations:fail closed
  if (validSources.length === 0) {
    return {
      answer: UNKNOWN_ANSWER,
      citations: [],
    };
  }

  //return answer with cited chunks only

  return {
    answer: answer,
    citations: validSources.map((source) => {
      const chunk = chunks[source - 1];
      return {
        source: source,
        documentId: chunk.documentId,
        chunkId: chunk.chunkId,
        score: chunk.score,
      };
    }),
  };
};

export async function* streamRAGAnswer(
  userId: string,
  question: string,
  history: ChatHistory = [],
) {
  const previousUserMessages = history
    .filter(
      (message) =>
        message.role === "USER" && message.content.trim() !== question.trim(),
    )
    .slice(-3);

  const retrievalQuery = [
    ...previousUserMessages.map((message) => message.content),
    question,
  ].join(" ");

  const chunks = await retrieveRelevantChunks(userId, retrievalQuery);

  // No relevant chunks
  if (chunks.length === 0) {
    yield {
      type: "text",
      content: UNKNOWN_ANSWER,
    };

    yield {
      type: "citations",
      citations: [],
    };

    return;
  }

  // Build context and prompt
  const context = buildRAGContext(chunks);

  const prompt = buildRAGPrompt(question, context, history);

  // Call LLM with streaming enabled
  const stream = await openai.chat.completions.create({
    model: AI_CONFIG.claudeModel,
    max_tokens: AI_CONFIG.maxTokens,
    stream: true,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  let fullAnswer = "";

  // Read streamed chunks
  for await (const part of stream) {
    const content = part.choices[0]?.delta?.content;

    if (typeof content === "string" && content.length > 0) {
      fullAnswer += content;

      yield {
        type: "text",
        content,
      };
    }
  }

  const answer = fullAnswer.trim();

  // Handle refusal
  if (answer.includes(UNKNOWN_ANSWER)) {
    yield {
      type: "citations",
      citations: [],
    };

    return;
  }

  // Extract cited source numbers
  const sourceNumbers = [
    ...new Set(
      [...answer.matchAll(/\[Source\s+(\d+)\]/g)].map((match) =>
        Number(match[1]),
      ),
    ),
  ];

  // Validate sources
  const validSources = sourceNumbers.filter(
    (source) =>
      Number.isInteger(source) && source >= 1 && source <= chunks.length,
  );

  // Fail closed if no valid citations
  if (validSources.length === 0) {
    yield {
      type: "citations",
      citations: [],
      refused: true,
    };

    return;
  }

  // Send citations after the answer is complete
  yield {
    type: "citations",
    citations: validSources.map((source) => {
      const chunk = chunks[source - 1];

      return {
        source,
        documentId: chunk.documentId,
        chunkId: chunk.chunkId,
        score: chunk.score,
      };
    }),
  };
}
