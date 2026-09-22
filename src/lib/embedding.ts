/* eslint-disable @typescript-eslint/no-explicit-any */
import { pipeline } from "@xenova/transformers";
import { AI_CONFIG } from "../config/ai";

let extractor: any;

const getExtractor = async () => {
  if (!extractor) {
    extractor = await pipeline(
      "feature-extraction",
      AI_CONFIG.embeddingModel
    );
  }

  return extractor;
};

export const generateEmbedding = async (text: string) => {
  const model = await getExtractor();

  const output = await model(text, {
    pooling: "mean",
    normalize: true,
  });

  return Array.from(output.data) as number[];
};