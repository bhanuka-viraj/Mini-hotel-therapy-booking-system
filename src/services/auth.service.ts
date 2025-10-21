// import * as bcrypt from "bcrypt";
// import * as jwt from "jsonwebtoken";
// import { createServiceLogger } from "../utils/logger.util";
// import { UserModel } from "../models/User.model";

// interface SignupData {
//   name: string;
//   email: string;
//   password: string;
//   phone?: string;
//   address?: string;
// }

// interface LoginData {
//   email: string;
//   password: string;
// }

// export class AuthService {
//   private logger = createServiceLogger("AuthService");

//   async signup(
//     data: SignupData
//   ): Promise<{ id: number; name: string; email: string }> {
//     this.logger.info("User signup initiated", { email: data.email });
//     const existingUser = await UserModel.findOne({ email: data.email });

//     if (existingUser) {
//       this.logger.warn("Signup failed: Email already exists", {
//         email: data.email,
//       });
//       throw new Error("Email already exists");
//     }
//     const hashedPassword = await bcrypt.hash(data.password, 10);
//     const user = new UserModel({
//       name: data.name,
//       email: data.email,
//       password: hashedPassword,
//       phone: data.phone,
//       address: data.address,
//       role: "user",
//     });

//     const saved = await user.save();
//     this.logger.info("User signup completed successfully", {
//       userId: saved._id,
//       email: saved.email,
//     });

//     return { id: Number(saved._id), name: saved.name, email: saved.email };
//   }

//   async login(data: LoginData): Promise<{
//     accessToken: string;
//     user: { id: number; name: string; email: string };
//   }> {
//     this.logger.info("User login initiated", { email: data.email });
//     const user = await UserModel.findOne({ email: data.email }).exec();

//     if (!user) {
//       this.logger.warn("Login failed: User not found", { email: data.email });
//       throw new Error("Invalid credentials");
//     }
//     const isPasswordValid = await bcrypt.compare(
//       data.password,
//       user.password || ""
//     );
//     if (!isPasswordValid) {
//       this.logger.warn("Login failed: Invalid password", { email: data.email });
//       throw new Error("Invalid credentials");
//     }

//     const accessToken = jwt.sign(
//       { userId: user._id.toString(), role: user.role },
//       process.env.JWT_SECRET!,
//       {
//         expiresIn: "1h",
//       }
//     );

//     this.logger.info("User login completed successfully", {
//       userId: user.id,
//       email: user.email,
//     });

//     return {
//       accessToken,
//       user: { id: Number(user._id), name: user.name, email: user.email },
//     };
//   }
// }
