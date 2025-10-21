import { OAuth2Client } from "google-auth-library";
import { UserModel } from "../models/User.model";
import jwtUtil from "../utils/jwt.util";
import { BadRequestError, UnauthorizedError } from "../errors/HttpError";
import { createServiceLogger } from "../utils/logger.util";
import { UserRole } from "../constants/user.roles";
import { bumpVersion } from "./cache/cache.service";
import USER_CACHE from "../constants/cache.keys";

interface GoogleUserInfo {
  sub: string; // Google user ID
  email: string;
  name: string;
  picture?: string;
  email_verified: boolean;
}

interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
}

export class GoogleAuthService {
  private googleClient: OAuth2Client;
  private logger = createServiceLogger("GoogleAuthService");

  constructor() {
    this.logger.info("GoogleAuthService constructor - Environment variables:");
    this.logger.info(
      `GOOGLE_CLIENT_ID: ${process.env.GOOGLE_CLIENT_ID ? "SET" : "NOT SET"}`
    );
    this.logger.info(
      `GOOGLE_CLIENT_SECRET: ${
        process.env.GOOGLE_CLIENT_SECRET ? "SET" : "NOT SET"
      }`
    );
    this.logger.info(
      `JWT_SECRET: ${process.env.JWT_SECRET ? "SET" : "NOT SET"}`
    );

    this.googleClient = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  async verifyGoogleToken(idToken: string): Promise<GoogleUserInfo> {
    try {
      this.logger.debug("Verifying Google token...");
      this.logger.debug(`Token length: ${idToken.length}`);
      this.logger.debug(`Token preview: ${idToken.substring(0, 50)}...`);

      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new Error("Invalid Google token payload");
      }

      this.logger.info(
        `Google token verified successfully for user: ${payload.email}`
      );

      return {
        sub: payload.sub,
        email: payload.email!,
        name: payload.name!,
        picture: payload.picture,
        email_verified: payload.email_verified!,
      };
    } catch (error) {
      this.logger.error("Google token verification failed:", error);
      throw new Error("Invalid Google token");
    }
  }

  async exchangeCodeForTokens(
    authorizationCode: string
  ): Promise<{ idToken: string; accessToken: string }> {
    try {
      this.logger.info("Exchanging authorization code for tokens...");

      const { tokens } = await this.googleClient.getToken(authorizationCode);

      if (!tokens.id_token) {
        throw new Error("No ID token received from Google");
      }

      this.logger.info("Successfully exchanged code for tokens");
      return {
        idToken: tokens.id_token,
        accessToken: tokens.access_token || "",
      };
    } catch (error) {
      const e: any = error;
      const details = e?.response?.data || e?.message || e;
      this.logger.error("Failed to exchange code for tokens:", details);

      const msg =
        typeof details === "string" ? details : JSON.stringify(details);
      throw new BadRequestError(
        `Failed to exchange authorization code for tokens: ${msg}`
      );
    }
  }

  async createOrUpdateUserFromGoogle(googleUser: GoogleUserInfo): Promise<{
    user: {
      id: string;
      email: string;
      role: string;
      name?: string;
      picture?: string;
    };
  }> {
    if (!googleUser.email_verified) {
      throw new BadRequestError("Google email not verified");
    }

    let user = await UserModel.findOne({ email: googleUser.email }).exec();

    if (!user) {
      // Determine role: first user becomes OWNER
      const existingCount = await UserModel.countDocuments({}).exec();
      const role = existingCount === 0 ? UserRole.OWNER : UserRole.STUDENT;

      user = new UserModel({
        email: googleUser.email,
        name: googleUser.name,
        picture: googleUser.picture,
        role,
        googleId: googleUser.sub,
      });

      await user.save();
      this.logger.info(`Created new user via Google: ${user.email}`);
      // cache invalidation removed for testing — bumpVersion available for future use
    } else if (!user.googleId) {
      user.googleId = googleUser.sub;
      // update name/picture if missing or changed
      if (googleUser.name && user.name !== googleUser.name)
        user.name = googleUser.name;
      if (googleUser.picture && user.picture !== googleUser.picture)
        user.picture = googleUser.picture;
      await user.save();
      // cache invalidation removed for testing — bumpVersion available for future use
    }

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        name: user.name,
        picture: user.picture,
      },
    };
  }

  private generateRandomPassword(): string {
    return Math.random().toString(36).slice(-10) + Date.now().toString(36);
  }
}
