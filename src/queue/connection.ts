import { Redis } from "ioredis";
import { envVars } from "../config/env";


export const redisConnection = new Redis(envVars.REDIS_URL!,{
      maxRetriesPerRequest: null,
});