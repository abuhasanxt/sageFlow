import { Worker } from "bullmq";
import { redisConnection } from "./connection";


export const documentWorker = new Worker(
  "document-Processing",
  async (job) => {
    console.log("Document job received!");

    const { documentId, userId } = job.data;

    console.log(
      "Processing document for Document:",
      documentId,
      "User:",
      userId,
    );
    return { success: true, documentId, userId };
  },
  {
    connection: redisConnection,
  },
);

documentWorker.on("completed", (job) => {
  console.log(`Document job ${job.id} completed`);
});

documentWorker.on("failed", (job, error) => {
  console.error(" Document job failed", {
    jobId: job?.id,
    documentId: job?.data?.documentId,
    attempt: job?.attemptsMade,
    error: error.message,
  });
});

documentWorker.on("error", (error) => {
  console.error("🔥 Document worker error:", error);
});
