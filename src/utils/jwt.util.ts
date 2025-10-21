import * as jwt from "jsonwebtoken";
import { UnauthorizedError } from "../errors/HttpError";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  // Do not throw here during module import in some environments, but log is helpful.
  // The verify/sign functions will throw if secret missing.
}

export const sign = (payload: object, options?: jwt.SignOptions): string => {
  if (!JWT_SECRET) throw new Error("JWT_SECRET not configured");
  return jwt.sign(payload, JWT_SECRET, options || {});
};

export const verify = (token: string): any => {
  if (!JWT_SECRET) throw new Error("JWT_SECRET not configured");
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err: any) {
    // Map JWT errors to UnauthorizedError
    if (err.name === "TokenExpiredError") {
      throw new UnauthorizedError("Token expired", {
        expiredAt: err.expiredAt,
      });
    }
    throw new UnauthorizedError("Invalid token");
  }
};

export default { sign, verify };
