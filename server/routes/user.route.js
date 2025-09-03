import { Router } from "express";
import {
  registerUserController,
  verifyEmailController,
  loginController,
  logoutController,
} from "../controllers/user.controller.js";

import { verifyJWT } from "../middlewares/auth.js";

const userRouter = Router();

// Public routes
userRouter.post("/register", registerUserController);
userRouter.get("/verify-email", verifyEmailController);
userRouter.post("/login", loginController);

// Protected route 
userRouter.post("/logout", verifyJWT, logoutController);

// test protected route
userRouter.get("/profile", verifyJWT, (req, res) => {
  res.json({ success: true, user: req.user });
});

export default userRouter;
