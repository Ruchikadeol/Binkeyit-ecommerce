// controllers/user.controller.js
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  registerUser,
  verifyEmail,
  loginUser,
  logoutUser,
  uploadAvatar,
  updateUserDetails,
  sendForgotPasswordOTP,
  verifyForgotPasswordOTP,
  resetPassword,
  refreshAccessToken,
  changePassword,
} from "../services/user.service.js";

// ---------------- REGISTER ----------------
export const registerUserController = asyncHandler(async (req, res) => {
  const user = await registerUser(req.body);
  res.status(201).json(
    new ApiResponse(
      201,
      { user: { id: user._id, name: user.name, email: user.email } },
      "User registered successfully. Please verify your email."
    )
  );
});

// ---------------- VERIFY EMAIL ----------------
export const verifyEmailController = asyncHandler(async (req, res) => {
  const message = await verifyEmail(req.query.token);
  res.status(200).json(new ApiResponse(200, null, message));
});

// ---------------- LOGIN ----------------
export const loginController = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await loginUser(req.body);

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
  await logoutUser(req.user?._id);

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
  });

  res.status(200).json(new ApiResponse(200, null, "Logout successful"));
});

// ---------------- UPLOAD AVATAR ----------------
export const uploadAvatarController = asyncHandler(async (req, res) => {
  const user = await uploadAvatar(req.user._id, req.file);
  res.status(200).json(new ApiResponse(200, { user }, "Avatar uploaded successfully"));
});

// ---------------- UPDATE USER DETAILS ----------------
export const updateUserDetailsController = asyncHandler(async (req, res) => {
  const user = await updateUserDetails(req.user._id, req.body, req.file);
  const responseData = {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          avatar: user.avatar,
        },
      }
  res.status(200).json(new ApiResponse(200,responseData,"User details updated successfully"));
});

// ---------------- SEND OTP ----------------
export const sendForgotPasswordOTPController = asyncHandler(async (req, res) => {
  await sendForgotPasswordOTP(req.body.email);
  res.status(200).json(new ApiResponse(200, null, "OTP sent to your email. It expires in 15 minutes"));
});

// ---------------- VERIFY OTP ----------------
export const verifyForgotPasswordOTPController = asyncHandler(async (req, res) => {
  await verifyForgotPasswordOTP(req.body);
  res.status(200).json(new ApiResponse(200, null, "OTP verified successfully"));
});

// ---------------- RESET PASSWORD ----------------
export const resetPasswordController = asyncHandler(async (req, res) => {
  await resetPassword(req.body);
  res.status(200).json(new ApiResponse(200, null, "Password reset successfully"));
});

// ---------------- REFRESH TOKEN ----------------
export const refreshAccessTokenController = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
  const { newAccessToken, newRefreshToken } = await refreshAccessToken(incomingRefreshToken);

  res.cookie("refreshToken", newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
  });

  res.status(200).json(
    new ApiResponse(
      200,
      { tokens: { accessToken: newAccessToken } },
      "Access token refreshed successfully"
    )
  );
});

// ---------------- CHANGE PASSWORD ----------------
export const changePasswordController = asyncHandler(async (req, res) => {
  await changePassword(req.user._id, req.body);

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
  });

  res.status(200).json(new ApiResponse(200, null, "Password changed successfully. Please log in again."));
});
