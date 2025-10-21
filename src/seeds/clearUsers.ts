import dotenv from "dotenv";
dotenv.config();

import { connectDB } from "../config/mongo.config";
import { UserModel } from "../models/User.model";
import { createServiceLogger } from "../utils/logger.util";

const logger = createServiceLogger("ClearUsers");

const clear = async () => {
  try {
    await connectDB();
    const result = await UserModel.deleteMany({}).exec();
    logger.info(`Deleted ${result.deletedCount ?? 0} users`);
    process.exit(0);
  } catch (error: any) {
    logger.error("Failed to clear users:", error);
    process.exit(1);
  }
};

clear();
