export const serialize = <T>(value: T): string => {
  return JSON.stringify(value);
};

export const deserialize = <T>(raw: string | null): T | null => {
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch (err) {
    return null;
  }
};

export const makeKey = (
  namespace: string,
  ...parts: Array<string | number | null | undefined>
) => {
  const filtered = parts
    .filter((p) => p !== null && p !== undefined)
    .map(String);
  return `${namespace}:${filtered.join(":")}`;
};

export const makeUserProfileKey = (userId: string) => {
  return makeKey("user:profile", userId);
};

export default {
  serialize,
  deserialize,
  makeKey,
  makeUserProfileKey,
};
