import express from "express";
import { prisma } from "../lib/prisma";
import { redisService } from "../lib/redis";
import { qdrant } from "../lib/qdran";

const router = express.Router()

router.get("/health", async (_req, res) => {
  const health = {
    api: "ok",
    database: "unknown",
    redis: "unknown",
    qdrant: "unknown",
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    health.database = "ok";
  } catch {
    health.database = "error";
  }

  try {
    const redisAvailable=await redisService.isAvailable()
    health.redis = redisAvailable ? "ok" : "error";
  } catch {
    health.redis = "error";
  }

  try {
    await qdrant.getCollections();
    health.qdrant = "ok";
  } catch {
    health.qdrant = "error";
  }

  const allHealthy = Object.values(health).every(
    (value) => value === "ok"
  );

  return res.status(allHealthy ? 200 : 503).json({
    success: allHealthy,
    message: allHealthy
      ? "SageFlow is healthy"
      : "SageFlow has unhealthy services",
    data: health,
  });
});

export const healthRoutes = router;