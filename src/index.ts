import "dotenv/config";
import express, { Express } from "express";
import cors from "cors";
import { connectDB } from "./config/mongo.config";
import { createServiceLogger } from "./utils/logger.util";
import morganMiddleware from "./middleware/logger.middleware";
import authRoutes from "./routes/auth.routes";
// vehicle/auction routes removed for auth-only template
import usersRoutes from "./routes/users.routes";
import errorHandler from "./middleware/error.middleware";

const logger = createServiceLogger("Server");

const app: Express = express();

app.use(morganMiddleware);

const origins = process.env.FRONTEND_ORIGIN?.split(",") || [];

app.use(
  cors({
    origin: origins,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.use(express.json());

import { API_BASE } from "./config/api.config";

app.use(`${API_BASE}/auth`, authRoutes);
app.use(`${API_BASE}/users`, usersRoutes);

// Centralized error handler (should be last middleware)
app.use(errorHandler);

const PORT = process.env.PORT || 8080;
const startServer = async () => {
  try {
    logger.info("Starting server initialization...");
    await connectDB();
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("Server startup error:", error);
    process.exit(1);
  }
};

startServer();
