// services/user.service.js
import UserModel from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import sendEmail from "../config/sendEmail.js";
import { verifyEmailTemplate } from "../utils/verifyEmailTemplate.js";
import generateAccessToken from "../utils/generateAccessToken.js";
import generateRefreshToken from "../utils/generateRefreshToken.js";
import { handleAvatarUpload, hashPassword } from "../utils/userHelpers.js";
import { ApiError } from "../utils/ApiError.js";

export const registerUser = async ({ name, email, password }) => {
  try {
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

    return newUser;
  } catch (error) {
    throw error instanceof ApiError ? error : new ApiError(500, error.message);
  }
};

export const verifyEmail = async (token) => {
  try {
    if (!token) throw new ApiError(400, "Verification token missing");

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.EMAIL_VERIFY_SECRET);
    } catch {
      throw new ApiError(400, "Invalid or expired token");
    }

    const user = await UserModel.findById(decoded.id);
    if (!user) throw new ApiError(404, "User not found");

    if (user.isVerified) return "Email already verified";

    user.isVerified = true;
    await user.save();

    return "Email verified successfully";
  } catch (error) {
    throw error instanceof ApiError ? error : new ApiError(500, error.message);
  }
};

export const loginUser = async ({ email, password }) => {
  try {
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

    return { user, accessToken, refreshToken };
  } catch (error) {
    throw error instanceof ApiError ? error : new ApiError(500, error.message);
  }
};

export const logoutUser = async (userId) => {
  try {
    if (userId) {
      await UserModel.findByIdAndUpdate(userId, { refreshToken: null });
    }
  } catch (error) {
    throw error instanceof ApiError ? error : new ApiError(500, error.message);
  }
};

export const uploadAvatar = async (userId, file) => {
  try {
    if (!file) throw new ApiError(400, "No file uploaded");

    const user = await UserModel.findById(userId);
    if (!user) throw new ApiError(404, "User not found");

    user.avatar = await handleAvatarUpload(file);
    await user.save();

    return user;
  } catch (error) {
    throw error instanceof ApiError ? error : new ApiError(500, error.message);
  }
};

export const updateUserDetails = async (userId, data, file) => {
  try {
    const { name, email, mobile, password } = data;

    const user = await UserModel.findById(userId);
    if (!user) throw new ApiError(404, "User not found");

    if (name) user.name = name;
    if (email) user.email = email;
    if (mobile) user.mobile = mobile;
    if (password) user.password = await hashPassword(password);
    if (file) user.avatar = await handleAvatarUpload(file);

    await user.save();
    return user;
  } catch (error) {
    throw error instanceof ApiError ? error : new ApiError(500, error.message);
  }
};

export const sendForgotPasswordOTP = async (email) => {
  try {
    if (!email) throw new ApiError(400, "Email is required");

    const user = await UserModel.findOne({ email });
    if (!user) throw new ApiError(404, "User not found");

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 15 * 60 * 1000);

    user.forgotPasswordOTP = otp;
    user.forgotPasswordOTPExpiry = expiry;
    await user.save();

    const html = `
      <p>Dear ${user.name},</p>
      <p>You requested a password reset. Use the OTP below. It is valid for 15 minutes.</p>
      <h2>${otp}</h2>
      <p>If you didn't request this, please ignore this email.</p>
      <p>Regards,<br/>Binkeyit Team</p>
    `;
    await sendEmail({ to: user.email, subject: "Password Reset OTP - Binkeyit", html });

    return true;
  } catch (error) {
    throw error instanceof ApiError ? error : new ApiError(500, error.message);
  }
};

export const verifyForgotPasswordOTP = async ({ email, otp }) => {
  try {
    const user = await UserModel.findOne({ email });
    if (!user) throw new ApiError(404, "User not found");

    if (!user.forgotPasswordOTP || user.forgotPasswordOTP !== otp) throw new ApiError(400, "Invalid OTP");
    if (user.forgotPasswordOTPExpiry < new Date()) throw new ApiError(400, "OTP has expired");

    return true;
  } catch (error) {
    throw error instanceof ApiError ? error : new ApiError(500, error.message);
  }
};

export const resetPassword = async ({ email, otp, newPassword }) => {
  try {
    const user = await UserModel.findOne({ email });
    if (!user) throw new ApiError(404, "User not found");

    if (!user.forgotPasswordOTP || user.forgotPasswordOTP !== otp) throw new ApiError(400, "Invalid OTP");
    if (user.forgotPasswordOTPExpiry < new Date()) throw new ApiError(400, "OTP has expired");

    user.password = await bcrypt.hash(newPassword, 10);
    user.forgotPasswordOTP = null;
    user.forgotPasswordOTPExpiry = null;
    await user.save();

    return true;
  } catch (error) {
    throw error instanceof ApiError ? error : new ApiError(500, error.message);
  }
};

export const refreshAccessToken = async (incomingRefreshToken) => {
  try {
    if (!incomingRefreshToken) throw new ApiError(401, "Refresh token missing");

    let decoded;
    try {
      decoded = jwt.verify(incomingRefreshToken, process.env.SECRET_KEY_REFRESH_TOKEN);
    } catch {
      throw new ApiError(401, "Invalid or expired refresh token");
    }

    const user = await UserModel.findById(decoded.id);
    if (!user) throw new ApiError(404, "User not found");
    if (user.refreshToken !== incomingRefreshToken) throw new ApiError(401, "Refresh token does not match");

    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    user.refreshToken = newRefreshToken;
    await user.save();

    return { newAccessToken, newRefreshToken };
  } catch (error) {
    throw error instanceof ApiError ? error : new ApiError(500, error.message);
  }
};

export const changePassword = async (userId, { oldPassword, newPassword }) => {
  try {
    const user = await UserModel.findById(userId);
    if (!user) throw new ApiError(404, "User not found");

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) throw new ApiError(401, "Old password is incorrect");

    user.password = await bcrypt.hash(newPassword, 10);
    user.refreshToken = null;

    await user.save();

    return true;
  } catch (error) {
    throw error instanceof ApiError ? error : new ApiError(500, error.message);
  }
};
