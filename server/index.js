import dotenv from "dotenv";
dotenv.config(); // Must be at top

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import helmet from "helmet";
import connectDB from "./config/connectDB.js";
import userRouter from "./routes/user.route.js";
import { globalErrorHandler } from "./middlewares/globalErrorHandler.js";

const app = express();

// Middleware
app.use(cors({ credentials: true, origin: process.env.FRONTEND_URL }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));
app.use(helmet({ crossOriginResourcePolicy: false }));

// Routes
app.get("/", (req, res) => {
  res.json({ message: `Server is running on port ${process.env.PORT || 8000}` });
});
app.use("/api/v1/users", userRouter);

// Global Error Handler
app.use(globalErrorHandler);

const PORT = process.env.PORT || 8000;

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.error("DB Connection Error:", err));
