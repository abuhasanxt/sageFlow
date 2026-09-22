/* eslint-disable @typescript-eslint/no-explicit-any */
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
 try {
    await qdrant.createPayloadIndex(collectionName, {
      field_name: "userId",
      field_schema: "keyword",
    });

    console.log("Qdrant userId payload index ready");
  } catch (error: any) {
    if (
      error?.data?.status?.error?.includes(
        "already exists"
      )
    ) {
      console.log("Qdrant userId payload index already exists");
      return;
    }

    throw error;
  }

  console.log("Qdrant userId payload index created");
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

export const searchUserDocuments = async (
  userId: string,
  vector: number[],
  limit = 5
) => {
  const COLLECTION_NAME = "sageflow_documents";
  const result = await qdrant.query(
    COLLECTION_NAME,
    {
      query: vector,
      limit,
      filter: {
        must: [
          {
            key: "userId",
            match: {
              value: userId,
            },
          },
        ],
      },
      with_payload: true,
    }
  );

  return result;
};