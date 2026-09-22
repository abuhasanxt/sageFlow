import { generateEmbedding } from "../../lib/embedding";
import { prisma } from "../../lib/prisma";
import { searchUserDocuments } from "../../lib/qdran";

export const retrieveRelevantChunks = async (
  userId: string,
  question: string,
) => {
  const queryVector = await generateEmbedding(question);

  const results = await searchUserDocuments(
    userId,
    queryVector,
    5,
  );

  const chunkIds = results.points
    .map((result) => result.payload?.chunkId)
    .filter(
      (chunkId): chunkId is string =>
        typeof chunkId === "string",
    );

  if (chunkIds.length === 0) {
    return [];
  }

  const chunks = await prisma.chunk.findMany({
    where: {
      id: {
        in: chunkIds,
      },
      userId,
    },
  });

  const chunkMap = new Map(
    chunks.map((chunk) => [chunk.id, chunk]),
  );

  return chunkIds
    .map((chunkId) => {
      const chunk = chunkMap.get(chunkId);

      if (!chunk) {
        return null;
      }

      const qdrantResult = results.points.find(
        (point) => point.payload?.chunkId === chunkId,
      );

      return {
        chunkId: chunk.id,
        documentId: chunk.documentId,
        content: chunk.content,
        score: qdrantResult?.score ?? 0,
      };
    })
    .filter(
      (
        chunk,
      ): chunk is {
        chunkId: string;
        documentId: string;
        content: string;
        score: number;
      } => chunk !== null,
    );
};
export const buildRAGContext = (
  chunks: {
    chunkId: string;
    documentId: string;
    content: string;
    score?: number;
  }[],
) => {
  if (chunks.length === 0) {
    return "No relevant information was found in the user's documents.";
  }

  return chunks
    .map((chunk, index) =>
      `
[Source ${index + 1}]
Document ID: ${chunk.documentId}
Chunk ID: ${chunk.chunkId}
${chunk.score !== undefined ? `Similarity: ${chunk.score}` : ""}

${chunk.content}
      `.trim(),
    )
    .join("\n\n---\n\n");
};
export const buildRAGPrompt = (question: string, context: string) => {
  return `
You are SageFlow, a knowledge assistant.

You must answer the user's question using ONLY the information
provided in the context below.

Rules:
1. Do not use outside knowledge.
2. Do not invent or assume facts.
3. If the answer is not available in the context, say exactly:
   "I don't know based on the provided documents."
4. Every factual claim must include a citation.
5. Use citations in this format: [Source 1], [Source 2].
6. Only cite a source when that source actually supports the claim.
7. Keep the answer clear and concise.

Context:
${context}

User Question:
${question}
`;
};
