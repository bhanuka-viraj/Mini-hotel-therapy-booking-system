import { createServiceLogger } from "../../utils/logger.util";
import cacheConfig from "../../config/cache.config";
import { Redis } from "@upstash/redis";
import type { CacheAdapter } from "./cache.factory";

const logger = createServiceLogger("RedisUpstashAdapter");

const makeAdapter = (): CacheAdapter => {
  if (!cacheConfig.restUrl || !cacheConfig.restToken) {
    throw new Error("Upstash config missing");
  }

  const client = new Redis({
    url: cacheConfig.restUrl!,
    token: cacheConfig.restToken!,
  });

  const safeGet = async (key: string): Promise<string | null> => {
    try {
      const res = await client.get(key);
      if (res === null || res === undefined) return null;
      return String(res);
    } catch (err) {
      logger.error("get failed", { key, err });
      return null;
    }
  };

  const safeSet = async (
    key: string,
    value: string,
    ttlSeconds?: number
  ): Promise<boolean> => {
    try {
      if (ttlSeconds && ttlSeconds > 0) {
        await client.set(key, value, { ex: ttlSeconds });
      } else {
        await client.set(key, value);
      }
      return true;
    } catch (err) {
      logger.error("set failed", { key, err });
      return false;
    }
  };

  const safeDel = async (key: string): Promise<boolean> => {
    try {
      await client.del(key);
      return true;
    } catch (err) {
      logger.error("del failed", { key, err });
      return false;
    }
  };

  const safeIncr = async (key: string): Promise<number | null> => {
    try {
      const v = await client.incr(key);
      return typeof v === "number" ? v : Number(v);
    } catch (err) {
      logger.error("incr failed", { key, err });
      return null;
    }
  };

  const safeExpire = async (
    key: string,
    ttlSeconds: number
  ): Promise<boolean> => {
    try {
      await client.expire(key, ttlSeconds);
      return true;
    } catch (err) {
      logger.error("expire failed", { key, err });
      return false;
    }
  };

  const shutdown = async () => {
    try {
      // @upstash/redis may expose disconnect() in some versions
      // call it if available; otherwise do nothing (REST-based client is stateless)
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      if (typeof client.disconnect === "function") await client.disconnect();
    } catch (err) {
      // best-effort
    }
  };

  return {
    getRaw: safeGet,
    setRaw: safeSet,
    del: safeDel,
    incr: safeIncr,
    expire: safeExpire,
    shutdown,
  };
};

export default makeAdapter;
