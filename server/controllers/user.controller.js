// controllers/user.controller.js
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
import { handleAvatarUpload, hashPassword } from "../utils/userHelpers.js";

// ---------------- REGISTER USER ----------------
export const registerUserController = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) throw new ApiError(400, "Name, email, and password are required");

  const existingUser = await UserModel.findOne({ email });
  if (existingUser) throw new ApiError(409, "User with this email already exists");

  const hashedPassword = await hashPassword(password);
  const newUser = await UserModel.create({ name, email, password: hashedPassword });

  // Generate email verification token
  const verifyToken = jwt.sign({ id: newUser._id }, process.env.EMAIL_VERIFY_SECRET, { expiresIn: "1h" });
  const verifyEmailUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verifyToken}`;

  await sendEmail({
    to: email,
    subject: "Verify your email - Binkeyit",
    html: verifyEmailTemplate({ name, url: verifyEmailUrl }),
  });

  res.status(201).json(
    new ApiResponse(
      201,
      { user: { id: newUser._id, name: newUser.name, email: newUser.email } },
      "User registered successfully. Please verify your email."
    )
  );
});

// ---------------- VERIFY EMAIL ----------------
export const verifyEmailController = asyncHandler(async (req, res) => {
  const { token } = req.query;
  if (!token) throw new ApiError(400, "Verification token missing");

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.EMAIL_VERIFY_SECRET);
  } catch {
    throw new ApiError(400, "Invalid or expired token");
  }

  const user = await UserModel.findById(decoded.id);
  if (!user) throw new ApiError(404, "User not found");

  if (user.isVerified)
    return res.status(200).json(new ApiResponse(200, null, "Email already verified"));

  user.isVerified = true;
  await user.save();

  res.status(200).json(new ApiResponse(200, null, "Email verified successfully"));
});

// ---------------- LOGIN ----------------
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

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
  });

  res.status(200).json(
    new ApiResponse(
      200,
      { user: { id: user._id, name: user.name, email: user.email }, tokens: { accessToken } },
      "Login successful"
    )
  );
});

// ---------------- LOGOUT ----------------
export const logoutController = asyncHandler(async (req, res) => {
  if (req.user) {
    await UserModel.findByIdAndUpdate(req.user._id, { refreshToken: null });
  }

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
  });

  res.status(200).json(new ApiResponse(200, null, "Logout successful"));
});

// ---------------- UPLOAD AVATAR ----------------
export const uploadAvatarController = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "No file uploaded");

  const user = await UserModel.findById(req.user._id);
  if (!user) throw new ApiError(404, "User not found");

  user.avatar = await handleAvatarUpload(req.file);
  await user.save();

  res.status(200).json(new ApiResponse(200, { user }, "Avatar uploaded successfully"));
});

// ---------------- UPDATE USER DETAILS ----------------
export const updateUserDetailsController = asyncHandler(async (req, res) => {
  const { name, email, mobile, password } = req.body;

  const user = await UserModel.findById(req.user._id);
  if (!user) throw new ApiError(404, "User not found");

  if (name) user.name = name;
  if (email) user.email = email;
  if (mobile) user.mobile = mobile;
  if (password) user.password = await hashPassword(password);

  if (req.file) user.avatar = await handleAvatarUpload(req.file);

  await user.save();

  res.status(200).json(
    new ApiResponse(
      200,
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          avatar: user.avatar,
        },
      },
      "User details updated successfully"
    )
  );
});


// ---------------- SEND OTP ----------------
export const sendForgotPasswordOTPController = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new ApiError(400, "Email is required");

  const user = await UserModel.findOne({ email });
  if (!user) throw new ApiError(404, "User not found");

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 min

  user.forgotPasswordOTP = otp;
  user.forgotPasswordOTPExpiry = expiry;
  await user.save();

  // Send OTP via email
  const html = `
    <p>Dear ${user.name},</p>
    <p>You requested a password reset. Use the OTP below. It is valid for 15 minutes.</p>
    <h2>${otp}</h2>
    <p>If you didn't request this, please ignore this email.</p>
    <p>Regards,<br/>Binkeyit Team</p>
  `;
  await sendEmail({ to: user.email, subject: "Password Reset OTP - Binkeyit", html });

  res.status(200).json(new ApiResponse(200, null, "OTP sent to your email. It expires in 15 minutes"));
});

// ---------------- VERIFY OTP ----------------
export const verifyForgotPasswordOTPController = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) throw new ApiError(400, "Email and OTP are required");

  const user = await UserModel.findOne({ email });
  if (!user) throw new ApiError(404, "User not found");

  if (!user.forgotPasswordOTP || user.forgotPasswordOTP !== otp)
    throw new ApiError(400, "Invalid OTP");

  if (user.forgotPasswordOTPExpiry < new Date())
    throw new ApiError(400, "OTP has expired");

  res.status(200).json(new ApiResponse(200, null, "OTP verified successfully"));
});

// ---------------- RESET PASSWORD ----------------
export const resetPasswordController = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword)
    throw new ApiError(400, "Email, OTP, and new password are required");

  const user = await UserModel.findOne({ email });
  if (!user) throw new ApiError(404, "User not found");

  if (!user.forgotPasswordOTP || user.forgotPasswordOTP !== otp)
    throw new ApiError(400, "Invalid OTP");

  if (user.forgotPasswordOTPExpiry < new Date())
    throw new ApiError(400, "OTP has expired");

  // Update password
  user.password = await bcrypt.hash(newPassword, 10);
  user.forgotPasswordOTP = null;
  user.forgotPasswordOTPExpiry = null;
  await user.save();

  res.status(200).json(new ApiResponse(200, null, "Password reset successfully"));
});