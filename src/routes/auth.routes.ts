import { Router } from "express";
import { GoogleAuthController } from "../controllers/google.auth.controller";
import asyncHandler from "../middleware/asyncHandler";

const router = Router();
const googleAuthController = new GoogleAuthController();

// Start OAuth flow (redirects user to Google)
router.get(
  "/google",
  asyncHandler(
    googleAuthController.initiateGoogleAuth.bind(googleAuthController)
  )
);

// OAuth callback: Google redirects here with code and state
router.get(
  "/google/callback",
  asyncHandler(googleAuthController.googleCallback.bind(googleAuthController))
);

export default router;
