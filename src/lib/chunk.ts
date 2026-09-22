const CHUNK_SIZE = 500;
const CHUNK_OVERLAP = 100;

export const chunkText = (text: string) => {
  const words = text.split(/\s+/).filter(Boolean);

  const chunks: string[] = [];

  let start = 0;

  while (start < words.length) {
    const end = Math.min(
      start + CHUNK_SIZE,
      words.length
    );

    const chunk = words
      .slice(start, end)
      .join(" ");

    chunks.push(chunk);

    if (end === words.length) {
      break;
    }

    start += CHUNK_SIZE - CHUNK_OVERLAP;
  }

  return chunks;
};
