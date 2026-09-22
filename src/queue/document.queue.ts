import { Queue } from "bullmq";
import { redisConnection } from "./connection";

export const documentQueue = new Queue("document-Processing", {
  connection: redisConnection,

  defaultJobOptions: {
    attempts: 5,

    backoff: {
      type: "exponential",
      delay: 5000,
    },

    removeOnComplete: true,
    removeOnFail: false,
  },
});


export const addDocumentJob = async (
  documentId: string,
  userId: string
) => {
  console.log(" Adding document job...");

  try {
    const job = await documentQueue.add("process-document", {
      documentId,
      userId,
    });

    console.log(" Document job added:", job.id);

    return job;
  } catch (error) {
    console.error(" Document queue error:", error);
    throw error;
  }
};