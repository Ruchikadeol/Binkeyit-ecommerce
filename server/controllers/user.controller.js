import UserModel from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import bcrypt from "bcryptjs";
import sendEmail from "../config/sendEmail.js";
import { verifyEmailTemplate } from "../utils/verifyEmailTemplate.js";
import generateAccessToken from "../utils/generateAccessToken.js";
import generateRefreshToken from "../utils/generateRefreshToken.js";

// ---------------------- REGISTER ----------------------
export async function registerUserController(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      throw new ApiError(400, "Name, email, and password are required");
    }

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      throw new ApiError(409, "User with this email already exists", [
        "Email already in use",
      ]);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await UserModel.create({
      name,
      email,
      password: hashedPassword,
      isVerified: false,
    });

    const verifyEmailUrl = `${process.env.FRONTEND_URL}/verify-email?user=${newUser._id}`;
    const emailSent = await sendEmail({
      to: email,
      subject: "Verify your email - Binkeyit",
      html: verifyEmailTemplate({ name, url: verifyEmailUrl }),
    });

    if (!emailSent) {
      throw new ApiError(500, "Failed to send verification email");
    }

    return res.status(201).json({
      message: "User registered successfully. Please verify your email.",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
      },
      success: true,
      error: false,
    });
  } catch (error) {
    const apiError =
      error instanceof ApiError
        ? error
        : new ApiError(
            500,
            error.message || "Something went wrong",
            error.stack
          );

    return res.status(apiError.statusCode).json({
      success: false,
      message: apiError.message,
      errors: apiError.errors || null,
    });
  }
}

// ---------------------- VERIFY EMAIL ----------------------
export async function verifyEmailController(req, res) {
  try {
    const { userId } = req.body; // pass userId or token from frontend
    const user = await UserModel.findById(userId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (user.isVerified) {
      return res.status(200).json({
        message: "Email already verified",
        success: true,
        error: false,
      });
    }

    user.isVerified = true;
    await user.save();

    return res.status(200).json({
      message: "Email verified successfully",
      success: true,
      error: false,
    });
  } catch (error) {
    const apiError =
      error instanceof ApiError
        ? error
        : new ApiError(
            500,
            error.message || "Something went wrong",
            error.stack
          );

    return res.status(apiError.statusCode).json({
      success: false,
      message: apiError.message,
      errors: apiError.errors || null,
    });
  }
}

// ---------------------- LOGIN ----------------------

export async function loginController(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ApiError(400, "Email and password are required");
    }

    const user = await UserModel.findOne({ email });
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (user.status !== "active") {
      throw new ApiError(403, "Please contact Admin.");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new ApiError(401, "Invalid email or password");
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.cookiesOption = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
    };

    res.cookie("accessToken", accessToken, res.cookiesOption);
    res.cookie("refreshToken", refreshToken, res.cookiesOption);

    return res.status(200).json({
      message: "Login successful",
      success: true,
      error: false,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
        tokens: {
          accessToken,
          refreshToken,
        },
      },
    });
  } catch (error) {
    const apiError =
      error instanceof ApiError
        ? error
        : new ApiError(
            500,
            error.message || "Something went wrong",
            error.stack
          );

    return res.status(apiError.statusCode).json({
      success: false,
      message: apiError.message,
      errors: apiError.errors || null,
    });
  }
}
