import Anthropic from "@anthropic-ai/sdk";
import { envVars } from "../config/env";
import { AI_CONFIG } from "../config/ai";

export const anthropic=new Anthropic({
    apiKey:envVars.ANTHROPIC_API_KEY
})

export const testClaudeConnection = async () => {
  const response = await anthropic.messages.create({
    model: AI_CONFIG.claudeModel,
    max_tokens: AI_CONFIG.maxTokens,
    messages: [
      {
        role: "user",
        content: "Reply with only: SageFlow connected",
      },
    ],
  });

  return response;
};