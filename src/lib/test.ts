import { generateEmbedding } from "./embedding";

export const test = async () => {
  const vector = await generateEmbedding(
    "SageFlow is an AI knowledge assistant."
  );

  console.log("Vector length:", vector.length);
};