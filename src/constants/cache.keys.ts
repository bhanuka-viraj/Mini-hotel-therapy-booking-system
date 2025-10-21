export const USER_CACHE = {
  USERS_LIST: "users:list",
  USERS_LIST_VERSION: "users:list:version",
  USER_PROFILE: "user:profile",
} as const;

export const OAUTH_CACHE = {
  STATE: "oauth:state",
} as const;

export type UserCacheKey = (typeof USER_CACHE)[keyof typeof USER_CACHE];

export default USER_CACHE;
