import { Router } from "express";
import { UsersController } from "../controllers/users.controller";
import {
  authMiddleware,
  ownDataMiddleware,
} from "../middleware/auth.middleware";
import { UserRole } from "../constants/user.roles";

const router = Router();
const usersController = new UsersController();

router.get("/me", authMiddleware, usersController.getMe.bind(usersController));

router.get(
  "/",
  authMiddleware(UserRole.OWNER, UserRole.ADMIN),
  usersController.getAllUsers.bind(usersController)
);

router.get(
  "/:id",
  authMiddleware,
  ownDataMiddleware,
  usersController.getUser.bind(usersController)
);

router.put(
  "/:id",
  authMiddleware,
  ownDataMiddleware,
  usersController.updateUser.bind(usersController)
);

router.delete(
  "/:id",
  authMiddleware(UserRole.OWNER, UserRole.ADMIN),
  usersController.deleteUser.bind(usersController)
);

router.put(
  "/:id/role",
  authMiddleware(UserRole.OWNER, UserRole.ADMIN),
  usersController.changeUserRole.bind(usersController)
);

export default router;
