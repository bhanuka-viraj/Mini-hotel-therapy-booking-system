import { Request, Response, NextFunction } from "express";
import jwtUtil from "../utils/jwt.util";
import apiResponse from "../utils/apiResponse.util";
import { UserRole } from "../constants/user.roles";
import { createServiceLogger } from "../utils/logger.util";
import { UsersService } from "../services/users.service";
import cacheService from "../services/cache/cache.service";
import { makeUserProfileKey } from "../utils/cache.util";

const logger = createServiceLogger("AuthMiddleware");

interface AuthRequest extends Request {
  user?: { userId: string; role?: UserRole };
}

const createAuthMiddleware = (allowedRoles: UserRole[] = []) => {
  const usersService = new UsersService();
  return async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      logger.warn("No Authorization header or missing Bearer token", {
        ip: req.ip,
        path: req.path,
      });
      res.status(401).json(apiResponse.fail("No bearer token provided"));
      return;
    }
    const token = authHeader.split(" ")[1];

    try {
      const decoded: any = jwtUtil.verify(token);
      const userId = decoded.userId as string;
      req.user = { userId };

      // If allowedRoles are required, fetch authoritative user role from cache or DB
      if (allowedRoles && allowedRoles.length > 0) {
        try {
          const cacheKey = makeUserProfileKey(userId);
          let user = await cacheService.get<any>(cacheKey);
          if (!user) {
            user = await usersService.getById(userId);
            // store minimal fields in cache
            await cacheService.set(
              cacheKey,
              { id: userId, role: (user as any).role },
              60
            );
          }

          const role = (user as any).role as UserRole;
          if (!allowedRoles.includes(role)) {
            logger.warn("Forbidden: insufficient role (authoritative)", {
              userId,
              required: allowedRoles,
              actual: role,
            });
            res
              .status(403)
              .json(apiResponse.fail("Forbidden: insufficient role"));
            return;
          }
          // attach role to req.user for downstream handlers
          req.user.role = role;
        } catch (err: any) {
          logger.error("Failed to fetch authoritative role", {
            err: err?.message,
          });
          res.status(500).json(apiResponse.fail("Internal error"));
          return;
        }
      }

      next();
    } catch (err: any) {
      logger.warn("Invalid or expired token", { err: err?.message });
      res
        .status(401)
        .json(apiResponse.fail("Invalid or expired token", err?.message));
    }
  };
};

// Exported middleware is both callable as a factory and usable directly.
// If used directly by Express (authMiddleware(req,res,next)), the function
// will detect the call shape and act as middleware with no role restriction.
export function authMiddleware(...rolesOrReq: any[]): any {
  // Called as middleware directly: (req, res, next)
  if (
    rolesOrReq &&
    rolesOrReq.length === 3 &&
    rolesOrReq[0] &&
    rolesOrReq[0].headers
  ) {
    const [req, res, next] = rolesOrReq as [
      AuthRequest,
      Response,
      NextFunction
    ];
    return createAuthMiddleware()(req, res, next);
  }

  // Otherwise treat arguments as allowed roles and return middleware
  const roles = (rolesOrReq as UserRole[]) || [];
  return createAuthMiddleware(roles);
}

// Middleware to ensure users can only access their own data
export const ownDataMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const userId = req.params.id;

  if (!req.user) {
    res.status(401).json(apiResponse.fail("Authentication required"));
    return;
  }
  if (req.user.userId !== userId) {
    res
      .status(403)
      .json(
        apiResponse.fail("Access denied. You can only access your own data.")
      );
    return;
  }

  next();
};
