// uploadOnCloudinary.js
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a local file to Cloudinary and clean up local file automatically.
 * @param {string} localFilePath - Path to the local file
 * @returns {Promise<Object>} - Cloudinary response object
 */
export const uploadOnCloudinary = async (localFilePath) => {
  if (!localFilePath) return null;

  try {
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    // Remove local file after successful upload
    if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);

    return response; // { secure_url, public_id, ... }
  } catch (error) {
    // Remove local file even if upload fails
    if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);

    console.error("Cloudinary upload error:", error);
    throw new Error("Failed to upload file to Cloudinary");
  }
};
