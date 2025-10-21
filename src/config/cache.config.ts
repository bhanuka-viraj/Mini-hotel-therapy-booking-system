import { createServiceLogger } from "../utils/logger.util";

const logger = createServiceLogger("CacheConfig");

export interface CacheConfig {
  enabled: boolean;
  restUrl?: string;
  restToken?: string;
  defaultTTLSeconds: number;
  requestTimeoutMs: number;
  retryCount: number;
  cachePrefix: string; // prefix applied to keys to avoid collisions
}

const parseBool = (v?: string, fallback = false) => {
  if (!v) return fallback;
  return ["1", "true", "yes", "on"].includes(v.toLowerCase());
};

const parseIntOr = (v: string | undefined, fallback: number) => {
  const n = v ? Number(v) : NaN;
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
};

const env = process.env;

const cacheConfig: CacheConfig = {
  enabled: parseBool(env.CACHE_ENABLED, true),
  restUrl: env.UPSTASH_REDIS_REST_URL,
  restToken: env.UPSTASH_REDIS_REST_TOKEN,
  defaultTTLSeconds: parseIntOr(env.CACHE_DEFAULT_TTL, 60),
  requestTimeoutMs: parseIntOr(env.CACHE_REQUEST_TIMEOUT_MS, 2000),
  retryCount: parseIntOr(env.CACHE_RETRY_COUNT, 1),
  cachePrefix: env.CACHE_PREFIX || "learnvia:",
};

// Validate minimal configuration but don't throw — we prefer fail-open behavior
if (cacheConfig.enabled) {
  if (!cacheConfig.restUrl || !cacheConfig.restToken) {
    logger.warn(
      "Cache is enabled but UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN is missing. Falling back to cache disabled.",
      { restUrl: !!cacheConfig.restUrl }
    );
    cacheConfig.enabled = false;
  } else {
    logger.info("Cache enabled (Upstash REST).", {
      restUrl: cacheConfig.restUrl.replace(/:\/\/.+@/, "https://***@"),
      defaultTTLSeconds: cacheConfig.defaultTTLSeconds,
      requestTimeoutMs: cacheConfig.requestTimeoutMs,
    });
  }
} else {
  logger.info("Cache disabled via CACHE_ENABLED=false");
}

export const getPrefixedKey = (key: string) =>
  `${cacheConfig.cachePrefix}${key}`;

export const isCacheEnabled = () => cacheConfig.enabled;

export const getDefaultTTL = () => cacheConfig.defaultTTLSeconds;

export default cacheConfig;
