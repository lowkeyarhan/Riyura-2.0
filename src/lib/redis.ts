import Redis from "ioredis";

const REDIS_TTL = 15 * 60;

let redisClient: Redis | null = null;

function getRedisClient(): Redis | null {
  const redisUrl = process.env.REDIS_URL;
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;

  if (!redisUrl && !upstashUrl) {
    console.log(
      "⚠️ Redis not configured - REDIS_URL or UPSTASH_REDIS_REST_URL missing"
    );
    return null;
  }

  if (!redisClient) {
    try {
      if (upstashUrl) {
        const upstashRedisUrl = upstashUrl
          .replace("https://", "rediss://")
          .replace(":443", "");
        const token = process.env.UPSTASH_REDIS_REST_TOKEN;

        redisClient = new Redis(upstashRedisUrl, {
          username: "default",
          password: token,
          family: 0,
          tls: {
            rejectUnauthorized: false,
          },
          maxRetriesPerRequest: 3,
          retryStrategy: (times) => {
            if (times > 3) {
              console.log("❌ Redis connection failed after 3 retries");
              return null;
            }
            return Math.min(times * 100, 3000);
          },
        });
      } else if (redisUrl) {
        redisClient = new Redis(redisUrl, {
          maxRetriesPerRequest: 3,
          retryStrategy: (times) => {
            if (times > 3) {
              console.log("❌ Redis connection failed after 3 retries");
              return null;
            }
            return Math.min(times * 100, 3000);
          },
        });
      }

      if (redisClient) {
        redisClient.on("connect", () => {
          console.log("✅ Redis connected successfully");
        });

        redisClient.on("error", (error) => {
          console.log("❌ Redis error:", error.message);
        });
      }
    } catch (error) {
      console.log(
        "❌ Redis initialization failed:",
        error instanceof Error ? error.message : "Unknown error"
      );
      redisClient = null;
    }
  }

  return redisClient;
}

export async function getCachedData<T>(key: string): Promise<T | null> {
  const client = getRedisClient();
  if (!client) return null;

  try {
    const cached = await client.get(key);
    if (cached) {
      console.log(`✅ Cache HIT for key: ${key}`);
      return JSON.parse(cached) as T;
    }
    console.log(`⚠️ Cache MISS for key: ${key}`);
    return null;
  } catch (error) {
    console.log(
      `❌ Redis GET error for key ${key}:`,
      error instanceof Error ? error.message : "Unknown error"
    );
    return null;
  }
}

export async function setCachedData<T>(key: string, data: T): Promise<void> {
  const client = getRedisClient();
  if (!client) return;

  try {
    await client.setex(key, REDIS_TTL, JSON.stringify(data));
    console.log(
      `✅ Cache SET for key: ${key} (TTL: ${REDIS_TTL}s / 15 minutes)`
    );
  } catch (error) {
    console.log(
      `❌ Redis SET error for key ${key}:`,
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}
