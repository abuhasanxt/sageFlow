import { QdrantClient } from "@qdrant/js-client-rest";
import { envVars } from "../config/env";
import { AI_CONFIG } from "../config/ai";

export const qdrant = new QdrantClient({
  url: envVars.QDRANT_URL,
  apiKey: envVars.QDRANT_API_KEY,
});

export const createQdrantCollection = async () => {
  const collectionName = "sageflow_documents";

  const collections = await qdrant.getCollections();

  const exists = collections.collections.some(
    (collection) => collection.name === collectionName
  );

  if (!exists) {
    await qdrant.createCollection(collectionName, {
      vectors: {
        size: AI_CONFIG.embeddingDimension,
        distance: "Cosine",
      },
    });

    console.log(`Qdrant collection "${collectionName}" created`);
  } else {
    console.log(`Qdrant collection "${collectionName}" already exists`);
  }
};