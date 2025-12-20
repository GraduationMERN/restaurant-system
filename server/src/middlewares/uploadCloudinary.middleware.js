import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import cloudinary from "../config/cloudinary.js";

// Configure storage
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "restaurant_uploads",                // folder in Cloudinary
    allowed_formats: ["jpg", "jpeg", "png", "webp", "webm", "mp3", "wav", "m4a"],
    resource_type: "auto",
  },
});

// Multer middleware
export const uploadCloud  = multer({ storage });
