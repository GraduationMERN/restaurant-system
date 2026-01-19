import admin from "../../../config/firebaseAdmin.js";
import User from "../model/User.js";
import { createAccessToken, createRefreshToken } from "../../../utils/jwt.js";
import jwt from "jsonwebtoken";
import { env } from "../../../config/env.js";
import logger from "../../../utils/logger.js";

const isProduction = env.nodeEnv === "production";

// Base cookie options
const cookieOptionsBase = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "None" : "Lax",
  maxAge: 15 * 60 * 1000,
  path: "/",
};

const cookieOptions = {
  ...cookieOptionsBase,
  ...(isProduction && process.env.COOKIE_DOMAIN
    ? { domain: process.env.COOKIE_DOMAIN }
    : {}),
};

/* ============================
   FIREBASE LOGIN
============================ */
export const firebaseLoginController = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    logger.info("Firebase login attempt", {
      hasToken: !!token,
      ip: req.ip,
    });

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(token);
    } catch (err) {
      logger.warn("Firebase token verification failed", {
        message: err.message,
      });
      return res.status(401).json({ message: "Invalid Firebase token" });
    }

    const { uid, phone_number, email, name, picture } = decodedToken;

    let user = await User.findOne({ firebaseUid: uid });

    if (!user) {
      const existingUser = await User.findOne({
        $or: [
          phone_number ? { phoneNumber: phone_number } : null,
          email ? { email } : null,
        ].filter(Boolean),
      });

      if (existingUser) {
        existingUser.firebaseUid = uid;
        existingUser.isVerified = true;
        if (!existingUser.email && email) existingUser.email = email;
        if (!existingUser.name && name) existingUser.name = name;
        if (!existingUser.avatarUrl && picture)
          existingUser.avatarUrl = picture;

        await existingUser.save();
        user = existingUser;
      } else {
        user = await User.create({
          firebaseUid: uid,
          phoneNumber: phone_number || null,
          email: email || null,
          name: name || null,
          avatarUrl: picture || null,
          isVerified: true,
          role: "customer",
        });
      }
    }

    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    res.cookie("accessToken", accessToken, cookieOptions);
    res.cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    logger.info("User authenticated successfully", {
      userId: user._id,
      provider: "firebase",
    });

    res.json({
      user: {
        _id: user._id,
        name: user.name || null,
        email: user.email || null,
        phoneNumber: user.phoneNumber || null,
        role: user.role,
        avatarUrl: user.avatarUrl || null,
        points: user.points,
        isVerified: user.isVerified,
      },
    });
  } catch (err) {
    logger.error("Firebase login error", {
      message: err.message,
      stack: err.stack,
    });

    res.status(500).json({
      message: err.message || "Internal server error",
    });
  }
};

/* ============================
   COMPLETE PROFILE
============================ */
export const completeProfileController = async (req, res) => {
  try {
    const { name } = req.body;

    logger.info("Complete profile attempt", {
      userId: req.user._id,
    });

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.name) {
      return res.status(400).json({ message: "Profile already completed" });
    }

    user.name = name;
    await user.save();

    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    res.cookie("accessToken", accessToken, cookieOptions);
    res.cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    logger.info("User profile completed", {
      userId: user._id,
    });

    res.json({
      message: "Profile completed successfully",
      user: {
        _id: user._id,
        name: user.name,
        phoneNumber: user.phoneNumber,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (err) {
    logger.error("Complete profile error", {
      userId: req.user?._id,
      message: err.message,
    });

    res.status(500).json({
      message: err.message || "Error completing profile",
    });
  }
};

/* ============================
   GET ME
============================ */
export const getMeController = async (req, res) => {
  try {
    logger.info("Get current user", {
      userId: req.user._id,
    });

    const user = await User.findById(req.user._id).select("-refreshToken");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    logger.error("Get me error", {
      userId: req.user?._id,
      message: err.message,
    });

    res.status(500).json({
      message: err.message || "Error fetching user",
    });
  }
};

/* ============================
   REFRESH TOKEN
============================ */
export const refreshTokenController = async (req, res) => {
  try {
    const refreshToken =
      req.cookies.refreshToken ||
      req.headers.authorization?.split(" ")[1];

    logger.info("Refresh token attempt", {
      hasToken: !!refreshToken,
    });

    if (!refreshToken) {
      return res.status(401).json({ message: "No refresh token provided" });
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, env.refreshJwtKey);
    } catch {
      logger.warn("Invalid refresh token");
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const user = await User.findOne({
      _id: decoded.userId,
      refreshToken,
    });

    if (!user) {
      return res.status(401).json({ message: "Token mismatch" });
    }

    const newAccessToken = createAccessToken(user);
    const newRefreshToken = createRefreshToken(user);

    user.refreshToken = newRefreshToken;
    await user.save();

    res.cookie("accessToken", newAccessToken, cookieOptions);
    res.cookie("refreshToken", newRefreshToken, {
      ...cookieOptions,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    logger.info("Token refreshed", {
      userId: user._id,
    });

    res.json({
      accessToken: newAccessToken,
      user: {
        _id: user._id,
        name: user.name,
        phoneNumber: user.phoneNumber,
        role: user.role,
        avatarUrl: user.avatarUrl,
        points: user.points,
        isVerified: user.isVerified,
      },
    });
  } catch (err) {
    logger.error("Refresh token error", {
      message: err.message,
    });

    res.status(500).json({
      message: err.message || "Error refreshing token",
    });
  }
};

/* ============================
   LOGOUT
============================ */
export const logoutController = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      await User.updateOne(
        { refreshToken },
        { $unset: { refreshToken: 1 } }
      );
    }

    res.clearCookie("accessToken", cookieOptions);
    res.clearCookie("refreshToken", cookieOptions);

    logger.info("User logged out", {
      userId: req.user?._id,
    });

    res.json({ message: "Logged out successfully" });
  } catch (err) {
    logger.error("Logout error", {
      message: err.message,
    });

    res.status(500).json({
      message: err.message || "Error logging out",
    });
  }
};
