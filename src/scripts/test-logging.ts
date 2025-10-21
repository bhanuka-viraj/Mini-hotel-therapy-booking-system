import { createServiceLogger } from "../utils/logger.util";

// Test basic logging
const logger = createServiceLogger("TestLogger");
logger.info("Testing basic logging functionality");
logger.warn("This is a warning message");
logger.error("This is an error message");
logger.debug("This is a debug message");

// Test service-specific logging
const userServiceLogger = createServiceLogger("UserService");
userServiceLogger.info("User authentication started");
userServiceLogger.debug("Processing user data", {
  userId: 123,
  email: "test@example.com",
});
userServiceLogger.error("User not found", { userId: 456 });

const authServiceLogger = createServiceLogger("AuthService");
authServiceLogger.info("Google OAuth flow initiated");
authServiceLogger.warn("Token expiration approaching", {
  expiresIn: "5 minutes",
});

console.log("Logging test completed. Check logs/combined.log for results.");
