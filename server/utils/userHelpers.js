import { uploadOnCloudinary } from "./uploadOnCloudinary.js";
import bcrypt from "bcryptjs";
import { ApiError } from "./ApiError.js";

export const handleAvatarUpload = async (file) => {
  if (!file) return null;

  const uploadResult = await uploadOnCloudinary(file.path);
  if (!uploadResult?.secure_url) throw new ApiError(500, "Avatar upload failed");

  return uploadResult.secure_url;
};

export const hashPassword = async (password) => {
  if (!password) return null;
  return await bcrypt.hash(password, 10);
};
