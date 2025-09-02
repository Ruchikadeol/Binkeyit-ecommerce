import { Router } from "express";
import {
  registerUserController,
  verifyEmailController,
  loginController,
} from "../controllers/user.controller.js";

const userRouter = Router();

// Route for user registration
userRouter.post("/register", registerUserController);
userRouter.get("/verify-email", verifyEmailController);
userRouter.post("/login", loginController);

export default userRouter;
