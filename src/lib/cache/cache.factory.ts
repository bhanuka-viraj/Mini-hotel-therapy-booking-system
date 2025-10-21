import { createServiceLogger } from "../../utils/logger.util";
import cacheConfig from "../../config/cache.config";
import makeUpstashAdapter from "./redis.upstash.adapter";

const logger = createServiceLogger("CacheFactory");

export interface CacheAdapter {
  getRaw(key: string): Promise<string | null>;
  setRaw(key: string, value: string, ttlSeconds?: number): Promise<boolean>;
  del(key: string): Promise<boolean>;
  incr(key: string): Promise<number | null>;
  expire(key: string, ttlSeconds: number): Promise<boolean>;
  shutdown?(): Promise<void>;
}

let instance: CacheAdapter | null = null;

export const getCacheAdapter = (): CacheAdapter => {
  if (instance) return instance;

  if (!cacheConfig.enabled) {
    logger.info("Cache disabled in config — using noop adapter");
    // simple noop adapter that always fails open
    instance = {
      getRaw: async () => null,
      setRaw: async () => false,
      del: async () => false,
      incr: async () => null,
      expire: async () => false,
      shutdown: async () => {},
    };
    return instance;
  }

  try {
    instance = makeUpstashAdapter();
    logger.info("Using Upstash cache adapter");
    return instance as CacheAdapter;
  } catch (err) {
    logger.error(
      "Failed to initialize cache adapter, falling back to noop",
      err
    );
    instance = {
      getRaw: async () => null,
      setRaw: async () => false,
      del: async () => false,
      incr: async () => null,
      expire: async () => false,
      shutdown: async () => {},
    };
    return instance;
  }
};

export default getCacheAdapter;
