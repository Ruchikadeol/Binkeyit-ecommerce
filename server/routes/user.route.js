import { Router } from "express";
import {
  registerUserController,
  verifyEmailController,
  loginController,
  logoutController,
  uploadAvatarController,
  updateUserDetailsController,
  sendForgotPasswordOTPController,
  verifyForgotPasswordOTPController,
  resetPasswordController,
  refreshAccessTokenController,
  changePasswordController,
} from "../controllers/user.controller.js";

import { verifyJWT } from "../middlewares/auth.js";
import { upload } from "../middlewares/multer.middleware.js";

const userRouter = Router();

// Public routes
userRouter.post("/register", registerUserController);
userRouter.get("/verify-email", verifyEmailController);
userRouter.post("/login", loginController);

// Protected routes
userRouter.post("/logout", verifyJWT, logoutController);
userRouter.get("/profile", verifyJWT, (req, res) => {
  res.json({ success: true, user: req.user });
});
userRouter.post("/refresh-token", refreshAccessTokenController);
userRouter.patch("/change-password", verifyJWT, changePasswordController);

// Update user details + optional avatar
userRouter.put(
  "/update",
  verifyJWT,
  upload.single("avatar"),
  updateUserDetailsController
);

// Forgot password flow
userRouter.post("/forgot-password/send-otp", sendForgotPasswordOTPController);
userRouter.post("/forgot-password/verify-otp", verifyForgotPasswordOTPController);
userRouter.post("/forgot-password/reset", resetPasswordController);

export default userRouter;
