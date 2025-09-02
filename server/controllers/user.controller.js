import userModel from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import bcrypt from "bcryptjs";
import sendEmail from "../config/sendEmail.js";
import { verifyEmailTemplate } from "../utils/verifyEmailTemplate.js";
export async function registerUserController(req, res) {
  try {
    const { name, email, password } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      throw new ApiError(400, "Name, email, and password are required");
    }

    // Check if user already exists
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      throw new ApiError(409, "User with this email already exists", [
        "Email already in use",
      ]);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = await userModel.create({
      name,
      email,
      password: hashedPassword,
    });

    // Send verification email
    const verifyEmailUrl = `${process.env.FRONTEND_URL}/verify-email?email=${email}`;
    const emailSent = await sendEmail({
      to: "rdeol@innow8apps.com",
      subject: "Verify your email - Binkeyit",
      html: verifyEmailTemplate({ name, url: verifyEmailUrl }),
    });

    if (!emailSent) {
      throw new ApiError(500, "Failed to send verification email");
    }

    // Respond with success
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
    // Handle errors consistently
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

export async function verifyEmailController(req, res) {
  try {
    const { code } = req.body;
    const user = await userModel.findOne({ _id: code });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const updateUser = await userModal.updateOne(
      { _id: code },
      { isVerified: true }
    );

    return res.status(200).json({
      message: "Email verified successfully",
      success: true,
      error: false,
    });
  } catch (error) {
    // Handle errors consistently
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

//Login Controller
export async function loginController(req, res) {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      throw new ApiError(400, "Email and password are required");
    }
  } catch (error) {
    // return res.status(500).json({
    //   message: error.message || error,
    //   error: true,
    //   success: false,

    throw new ApiError(500, error?.message || error);
  }
}
