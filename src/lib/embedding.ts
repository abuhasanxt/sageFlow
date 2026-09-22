/* eslint-disable @typescript-eslint/no-explicit-any */
import { pipeline } from "@xenova/transformers";
import { AI_CONFIG } from "../config/ai";

let extractor: any = null;

const getExtractor = async () => {
  if (!extractor) {
    extractor = await pipeline(
      "feature-extraction",
      AI_CONFIG.embeddingModel,
    );
  }

  return extractor;
};

export const generateEmbedding = async (
  text: string,
): Promise<number[]> => {
  if (!text.trim()) {
    throw new Error("Text cannot be empty for embedding");
  }

  const model = await getExtractor();

  const output = await model(text, {
    pooling: "mean",
    normalize: true,
  });

  return Array.from(output.data) as number[];
};

export const generateEmbeddings = async (
  texts: string[],
): Promise<number[][]> => {
  if (texts.length === 0) {
    return [];
  }

  const model = await getExtractor();

  const embeddings: number[][] = [];

  for (const text of texts) {
    if (!text.trim()) {
      embeddings.push([]);
      continue;
    }

    const output = await model(text, {
      pooling: "mean",
      normalize: true,
    });

    embeddings.push(Array.from(output.data) as number[]);
  }

  return embeddings;
};