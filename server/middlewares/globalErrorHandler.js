import { ApiError } from "../utils/ApiError.js";

export const globalErrorHandler = (err, req, res, next) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ success: false, message: err.message, errors: err.errors });
  }
  return res.status(500).json({ success: false, message: err.message || "Something went wrong", errors: [] });
};
