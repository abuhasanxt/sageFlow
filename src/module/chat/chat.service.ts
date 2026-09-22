import { generateEmbedding } from "../../lib/embedding";
import { searchUserDocuments } from "../../lib/qdran";


export const retrieveRelevantChunks = async (
  userId: string,
  question: string
) => {
  // 1. Question → vector
  const queryVector = await generateEmbedding(question);

  // 2. Search user's documents
  const results = await searchUserDocuments(
    userId,
    queryVector,
    5
  );

  return results;
};