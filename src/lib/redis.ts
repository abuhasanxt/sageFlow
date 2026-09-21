/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient, RedisClientType } from "redis";
import { envVars } from "../config/env";

class RedisService {
  private client: RedisClientType | null = null;
  private isConnected: boolean = false;
  async connect(): Promise<void> {
    try {
      const redisUrl = envVars.REDIS_URL;
      this.client = createClient({ url: redisUrl });

      //Handle connection events
      this.client.on("error", (err) => {
        console.error("Redis Client Error: ", err);
        this.isConnected = false;
      });

      this.client.on("connect", () => {
        console.log("Redis Client Connected");
        this.isConnected = true;
      });

      this.client.on("ready", () => {
        console.log("Redis Client Ready");
        this.isConnected = true;
      });

      this.client.on("end", () => {
        console.log("Redis Client Disconnected");
        this.isConnected = false;
      });

      this.client.on("reconnecting", () => {
        console.log("Redis Clint Reconnecting");
      });

      await this.client.connect();
    } catch (error) {
      console.log(error);
      this.isConnected = false;
    }
  }
  private ensureConnection(): RedisClientType {
    if (!this.client) {
      throw new Error("Redis client not initialized . Call connect() first.");
    }
    if (!this.isConnected) {
      throw new Error("Redis client not connect. ");
    }

    return this.client;
  }

  async get<T>(key: string): Promise<T | null> {
  try {
    const client = this.ensureConnection();

    const value = await client.get(key);

    if (!value) {
      return null;
    }

    return JSON.parse(value) as T;
  } catch (error) {
    console.error("Redis GET Error:", error);
    return null;
  }
}

  async set(key: string, value: any, ttlInSeconds: number): Promise<void> {
    try {
      const client = this.ensureConnection();

      const stringValue =
        typeof value === "string" ? value : JSON.stringify(value);
      await client.set(key, stringValue, { EX: ttlInSeconds });
    } catch (error) {
      console.log("Redis SET error : ", error);
    }
  }

  async update(key: string, value: any, ttlInSeconds: number): Promise<void> {
    await this.set(key, value, ttlInSeconds);
  }

  async delete(key: string): Promise<void> {
    try {
      const client = this.ensureConnection();
      await client.del(key);
    } catch (error) {
      console.log("Redis DELETE Error", error);
    }
  }
async deleteByPattern(pattern: string): Promise<void> {
  try {
    const client = this.ensureConnection();

    for await (const keys of client.scanIterator({
      MATCH: pattern,
      COUNT: 100,
    })) {
      for (const key of keys) {
        console.log("Delete Redis key:",key);
        await client.del(key);
      }
    }
  } catch (error) {
    console.error("Redis DELETE BY PATTERN Error:", error);
  }
}

  async isAvailable(): Promise<boolean> {
    try {
      const client = this.ensureConnection();
      await client.ping();
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  async disConnect(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
    }
  }
}

export const redisService = new RedisService();
