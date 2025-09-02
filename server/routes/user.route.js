import { Router } from "express";
import { registerUserController } from "../controllers/user.controller.js";

const userRouter = Router();

// Route for user registration
userRouter.post("/register", registerUserController);
userRouter.get("/verify-email", verifyEmailController);
export default userRouter;
