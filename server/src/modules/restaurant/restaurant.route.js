import express from "express";
import {
  getRestaurant,
  updateRestaurant,
  uploadLogo,
  uploadMenuImage,
  generateMenuImage,
} from "./restaurant.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";
import { uploadCloud } from "../../middlewares/uploadCloudinary.middleware.js";

const app = express.Router();

app.get("/", getRestaurant);
app.put("/", authMiddleware, roleMiddleware("admin"), updateRestaurant);

// Upload logo (admin only)
app.post(
  "/upload-logo",
  authMiddleware,
  roleMiddleware("admin"),
  uploadCloud.single("logo"),
  uploadLogo
);

// Upload menu image (admin only)
app.post(
  "/upload-menu-image",
  authMiddleware,
  roleMiddleware("admin"),
  uploadCloud.single("menuImage"),
  uploadMenuImage
);

// Generate menu image from products (admin only)
app.post(
  "/generate-menu-image",
  authMiddleware,
  roleMiddleware("admin"),
  generateMenuImage
);

export default app;
