import UserModel from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import bcrypt from "bcryptjs";
import sendEmail from "../config/sendEmail.js";
import { verifyEmailTemplate } from "../utils/verifyEmailTemplate.js";
import generateAccessToken from "../utils/generateAccessToken.js";
import generateRefreshToken from "../utils/generateRefreshToken.js";
import jwt from "jsonwebtoken";

// REGISTER USER
export const registerUserController = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) throw new ApiError(400, "Name, email, and password are required");

  const existingUser = await UserModel.findOne({ email });
  if (existingUser) throw new ApiError(409, "User with this email already exists");

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = await UserModel.create({ name, email, password: hashedPassword });

  // Generate email verification token
  const verifyToken = jwt.sign({ id: newUser._id }, process.env.EMAIL_VERIFY_SECRET, { expiresIn: "1h" });
  const verifyEmailUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verifyToken}`;

  await sendEmail({ to: email, subject: "Verify your email - Binkeyit", html: verifyEmailTemplate({ name, url: verifyEmailUrl }) });

  res.status(201).json(new ApiResponse(201, { user: { id: newUser._id, name: newUser.name, email: newUser.email } }, "User registered successfully. Please verify your email."));
});

// VERIFY EMAIL
export const verifyEmailController = asyncHandler(async (req, res) => {
  const { token } = req.query;
  if (!token) throw new ApiError(400, "Verification token missing");

  let decoded;
  try { decoded = jwt.verify(token, process.env.EMAIL_VERIFY_SECRET); }
  catch { throw new ApiError(400, "Invalid or expired token"); }

  const user = await UserModel.findById(decoded.id);
  if (!user) throw new ApiError(404, "User not found");
  if (user.isVerified) return res.status(200).json(new ApiResponse(200, null, "Email already verified"));

  user.isVerified = true;
  await user.save();
  res.status(200).json(new ApiResponse(200, null, "Email verified successfully"));
});

// LOGIN
export const loginController = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, "Email and password are required");

  const user = await UserModel.findOne({ email });
  if (!user) throw new ApiError(404, "User not found");
  if (user.status !== "active") throw new ApiError(403, "Please contact Admin");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new ApiError(401, "Invalid email or password");

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshToken = refreshToken;
  await user.save();

  res.cookie("refreshToken", refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "Strict" });
  res.status(200).json(new ApiResponse(200, { user: { id: user._id, name: user.name, email: user.email }, tokens: { accessToken } }, "Login successful"));
});

// LOGOUT
export const logoutController = asyncHandler(async (req, res) => {
  if (req.user) await UserModel.findByIdAndUpdate(req.user._id, { refreshToken: null });

  res.clearCookie("refreshToken", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "Strict" });
  res.status(200).json(new ApiResponse(200, null, "Logout successful"));
});
