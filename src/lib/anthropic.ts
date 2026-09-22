import Anthropic from "@anthropic-ai/sdk";
import { envVars } from "../config/env";

export const anthropic=new Anthropic({
    apiKey:envVars.ANTHROPIC_API_KEY
})

export const testClaudeConnection = async () => {
  const response = await anthropic.messages.create({
    model: "claude-3-5-haiku-latest",
    max_tokens: 20,
    messages: [
      {
        role: "user",
        content: "Reply with only: SageFlow connected",
      },
    ],
  });

  return response;
};