import { retrieveRelevantChunks } from "../module/chat/chat.service";
import { generateEmbedding } from "./embedding";

export const test = async () => {
  const vector = await generateEmbedding(
    "SageFlow is an AI knowledge assistant."
  );

  console.log("Vector length:", vector.length);
};


export const testRetrieval = async () => {
  const userId ="96efaf35-1114-49a5-b583-2370409a8d9d";

  const question = "What is react?";

  const results = await retrieveRelevantChunks(
    userId,
    question
  );

  console.log(
    JSON.stringify(results, null, 2)
  );
};