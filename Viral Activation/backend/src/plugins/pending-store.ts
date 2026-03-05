import fp from "fastify-plugin";
import { Redis } from "ioredis";

export interface PendingStore {
  set(key: string, value: string, ttlSeconds: number): Promise<void>;
  get(key: string): Promise<string | null>;
  del(key: string): Promise<void>;
}

class MemoryStore implements PendingStore {
  private data = new Map<string, { value: string; expiresAt: number }>();

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    this.data.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  async get(key: string): Promise<string | null> {
    const item = this.data.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.data.delete(key);
      return null;
    }
    return item.value;
  }

  async del(key: string): Promise<void> {
    this.data.delete(key);
  }
}

class RedisStore implements PendingStore {
  constructor(private readonly redis: Redis) {}

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    await this.redis.set(key, value, "EX", ttlSeconds);
  }

  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }
}

export const pendingStorePlugin = fp(async (app) => {
  const redisUrl = app.appConfig.redisUrl;
  if (!redisUrl) {
    app.decorate("pendingStore", new MemoryStore());
    return;
  }

  const redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    lazyConnect: true
  });
  await redis.connect();
  await redis.ping();
  app.decorate("pendingStore", new RedisStore(redis));
  app.addHook("onClose", async () => {
    redis.disconnect();
  });
});
