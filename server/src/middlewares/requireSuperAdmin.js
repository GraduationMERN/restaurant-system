import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import User from "../modules/user/model/User.js";
import logger from "../utils/logger.js";

const requireSuperAdmin = async (req, res, next) => {
  try {
    // Extract token from headers
    const token = req.cookies.accessToken || req.headers.authorization?.split(" ")[1];

    if (!token) {
      logger.info("unauthorized_supadmin_access", { path: req.originalUrl });
      return res.status(401).json({ message: "Not authorized" });
    }

    // Verify JWT
    const decoded = jwt.verify(token, env.jwtKey);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      logger.info("user_not_found", { userId: decoded.id });
      return res.status(401).json({ message: "User not found" });
    }

    // Check if super_admin
    if (user.role !== "super_admin") {
      logger.info("forbidden_supadmin_access", {
        userId: user._id,
        role: user.role,
        path: req.originalUrl,
      });
      return res.status(403).json({ message: "Forbidden: super_admin role required" });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (err) {
    logger.error("requireSuperAdmin_error", { message: err.message, path: req.originalUrl });
    return res.status(401).json({ message: "Not authorized" });
  }
};

export default requireSuperAdmin;
