import mongoose from "mongoose";
import { createServiceLogger } from "../utils/logger.util";

const logger = createServiceLogger("MongoDB");

export const connectDB = async (): Promise<typeof mongoose> => {
  const uri = process.env.MONGO_URI || "mongodb://localhost:27017/learnvia";
  try {
    logger.info(`Connecting to MongoDB: ${uri}`);
    await mongoose.connect(uri, {
      // useNewUrlParser, useUnifiedTopology are defaults in modern mongoose
    } as any);
    logger.info("MongoDB connected");
    return mongoose;
  } catch (error) {
    logger.error("MongoDB connection error:", error);
    throw error;
  }
};

export default mongoose;
