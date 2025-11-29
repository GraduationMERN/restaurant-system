import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import cloudinary from "../config/cloudinary.js";

// Configure storage
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "reviews",                // folder in Cloudinary
    allowed_formats: ["jpg", "jpeg", "png","webp"],
  },
});

// Multer middleware
export const uploadCloud  = multer({ storage });
