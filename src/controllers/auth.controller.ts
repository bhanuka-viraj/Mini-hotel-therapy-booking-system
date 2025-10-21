// import { Request, Response } from "express";
// import { AuthService } from "../services/auth.service";
// import { createServiceLogger } from "../utils/logger.util";

// export class AuthController {
//   private authService = new AuthService();
//   private logger = createServiceLogger("AuthController");

//   async signup(req: Request, res: Response): Promise<void> {
//     try {
//       this.logger.info("User signup request received", {
//         email: req.body.email,
//       });

//       const user = await this.authService.signup(req.body);

//       this.logger.info("User signup completed successfully", {
//         userId: (user as any).id,
//       });
//       res.status(201).json(user);
//     } catch (error: any) {
//       this.logger.error("User signup failed", {
//         error: error.message,
//         email: req.body.email,
//       });

//       res.status(error.message === "Email already exists" ? 400 : 500).json({
//         statusCode: error.message === "Email already exists" ? 400 : 500,
//         message: error.message,
//       });
//     }
//   }

//   async login(req: Request, res: Response): Promise<void> {
//     try {
//       this.logger.info("User login request received", {
//         email: req.body.email,
//       });

//       const result = await this.authService.login(req.body);

//       this.logger.info("User login completed successfully", {
//         userId: result.user.id,
//         email: result.user.email,
//       });

//       res.json(result);
//     } catch (error: any) {
//       this.logger.error("User login failed", {
//         error: error.message,
//         email: req.body.email,
//       });

//       res.status(401).json({ statusCode: 401, message: error.message });
//     }
//   }
// }
