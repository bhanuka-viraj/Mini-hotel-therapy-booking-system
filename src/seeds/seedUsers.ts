import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { UserModel } from "../models/User.model";
import { createServiceLogger } from "../utils/logger.util";
import { connectDB } from "../config/mongo.config";
import { UserRole } from "../constants/user.roles";

const logger = createServiceLogger("SeedUsers");

const randomName = () => {
  const names = [
    "Alex",
    "Sam",
    "Jordan",
    "Taylor",
    "Morgan",
    "Casey",
    "Riley",
    "Parker",
    "Quinn",
    "Avery",
  ];
  return names[Math.floor(Math.random() * names.length)];
};

const randomEmail = (i: number) => `user${Date.now()}_${i}@example.com`;

const createRandomUsers = (count: number) => {
  const users = [] as any[];
  for (let i = 0; i < count; i++) {
    users.push({
      email: randomEmail(i),
      name: `${randomName()} ${Math.floor(Math.random() * 1000)}`,
      picture: `https://picsum.photos/seed/${Math.floor(
        Math.random() * 10000
      )}/200/200`,
      role: i === 0 ? UserRole.OWNER : UserRole.STUDENT,
      // Owner gets current timestamp; others get a random recent timestamp within last 7 days
      lastLoggedIn:
        i === 0
          ? new Date()
          : new Date(
              Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)
            ),
    });
  }
  return users;
};

const seed = async () => {
  try {
    await connectDB();

    const countToCreate = parseInt(process.env.SEED_USERS_COUNT || "50") || 50;
    const users = createRandomUsers(countToCreate);
    const created = await UserModel.insertMany(users);
    logger.info(`Inserted ${created.length} users`);
    process.exit(0);
  } catch (error: any) {
    logger.error("Seeding failed:", error);
    process.exit(1);
  }
};

seed();
