/* eslint-disable @typescript-eslint/no-explicit-any */
import { QdrantClient } from "@qdrant/js-client-rest";
import { envVars } from "../config/env";
import { AI_CONFIG } from "../config/ai";

export const qdrant = new QdrantClient({
  url: envVars.QDRANT_URL,
  apiKey: envVars.QDRANT_API_KEY,
});
export const COLLECTION_NAME = "sageflow_documents";
export const createQdrantCollection = async () => {
  const collections = await qdrant.getCollections();

  const exists = collections.collections.some(
    (collection) => collection.name === COLLECTION_NAME,
  );

  if (!exists) {
    await qdrant.createCollection(COLLECTION_NAME, {
      vectors: {
        size: AI_CONFIG.embeddingDimension,
        distance: "Cosine",
      },
    });

    console.log(
      `Qdrant collection "${COLLECTION_NAME}" created`,
    );
  } else {
    console.log(
      `Qdrant collection "${COLLECTION_NAME}" already exists`,
    );
  }

  // Create payload index after collection exists
  try {
    await qdrant.createPayloadIndex(COLLECTION_NAME, {
      field_name: "userId",
      field_schema: "keyword",
    });

    console.log("Qdrant userId payload index created");
  } catch (error: any) {
    const message =
      error?.data?.status?.error ||
      error?.message ||
      "";

    if (message.toLowerCase().includes("already exists")) {
      console.log(
        "Qdrant userId payload index already exists",
      );
    } else {
      throw error;
    }
  }
};

export const searchUserDocuments = async (
  userId: string,
  vector: number[],
  limit = 5,
) => {
  if (!userId) {
    throw new Error("userId is required");
  }

  if (!vector.length) {
    throw new Error("Query vector cannot be empty");
  }

  const result = await qdrant.query(COLLECTION_NAME, {
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
  });

  return result;
};