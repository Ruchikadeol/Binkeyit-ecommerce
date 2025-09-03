import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import UserModel from "../models/user.model.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "").trim();
  if (!token) throw new ApiError(401, "Unauthorized request");

  let decoded;
  try { decoded = jwt.verify(token, process.env.SECRET_KEY_ACCESS_TOKEN); }
  catch { throw new ApiError(401, "Invalid access token"); }

  const user = await UserModel.findById(decoded.id).select("-password -refreshToken");
  if (!user) throw new ApiError(401, "Invalid access token");

  req.user = user;
  next();
});
