import OpenAI from "openai";
import { envVars } from "../config/env";
import { AI_CONFIG } from "../config/ai";

export const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: envVars.OPENAI_API_KEY,
});

export const testClaudeConnection = async () => {
  const completion = await openai.chat.completions.create({
    model: AI_CONFIG.claudeModel,
    messages: [
      {
        role: "system",
        content: "You are a helpful assistant.",
      },
      {
        role: "user",
        content: "What is JavaScript?",
      },
    ],
  });

  const result = completion.choices[0]?.message?.content;

  console.log("AI response:", result);

  return result;
};