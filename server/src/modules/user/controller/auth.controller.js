import admin from "../../../config/firebaseAdmin.js";
import User from "../model/User.js";
import { createAccessToken, createRefreshToken } from "../../../utils/jwt.js";
import jwt from "jsonwebtoken";
import { env } from "../../../config/env.js";

const isProduction = env.nodeEnv === "production";

// Base cookie options
const cookieOptionsBase = {
  httpOnly: true,
  sameSite: isProduction ? "None" : "Lax",
  secure: isProduction,
  maxAge: 15 * 60 * 1000,
  path: "/",
};

const cookieOptions = {
  ...cookieOptionsBase,
  ...(process.env.COOKIE_DOMAIN ? { domain: process.env.COOKIE_DOMAIN } : {}),
};
export const firebaseLoginController = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    // Verify Firebase ID token - THIS WAS MISSING!
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    const {
      uid,
      phone_number,
      email,
      name,
      picture,
    } = decodedToken;

    // Find user by Firebase UID
    let user = await User.findOne({ firebaseUid: uid });

    if (!user) {
      user = await User.create({
        firebaseUid: uid,
        phoneNumber: phone_number || null,
        email: email || null,
        name: name || null,
        avatarUrl: picture || null,
        isVerified: true,
        role: "customer",
      });
    } else {
      // Update existing user if not verified
      if (!user.isVerified) {
        user.isVerified = true;
        await user.save();
      }
    }

    // Generate tokens
    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);

    // Save refresh token to user
    user.refreshToken = refreshToken;
    await user.save();

    // Set cookies with appropriate settings
    res.cookie("accessToken", accessToken, cookieOptions);
    res.cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: 30 * 24 * 60 * 60 * 1000
    });

    // Return user and access token
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
      accessToken,
    });
  } catch (err) {
    console.error("Firebase login error:", err);
    res.status(401).json({
      message: err.message || "Invalid Firebase token"
    });
  }
};


export const completeProfileController = async (req, res) => {
  try {
    const { name } = req.body; // Phone is already in req.user from the login step

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    // Get the user attached by authMiddleware
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.name) {
      return res.status(400).json({ message: "Profile already completed" });
    }

    // Update user profile
    user.name = name;
    await user.save();

    // Generate new tokens with the updated name
    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    // IMPORTANT: Set cookies so the frontend is automatically updated
    res.cookie("accessToken", accessToken, cookieOptions);
    res.cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: 30 * 24 * 60 * 60 * 1000,
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
      accessToken,
    });
  } catch (err) {
    console.error("Complete profile error:", err);
    res.status(500).json({ message: err.message || "Error completing profile" });
  }
};

export const getMeController = async (req, res) => {
  try {
    // User is already attached to req by authMiddleware
    const user = await User.findById(req.user._id).select("-refreshToken");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error("Get me error:", err);
    res.status(500).json({
      message: err.message || "Error fetching user profile"
    });
  }
};

export const refreshTokenController = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: "No refresh token provided" });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, env.refreshJwtKey);
    } catch (err) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    // Find user with this refresh token
    const user = await User.findOne({
      _id: decoded.userId,
      refreshToken
    });

    if (!user) {
      return res.status(401).json({ message: "User not found or token mismatch" });
    }

    // Generate new tokens
    const newAccessToken = createAccessToken(user);
    const newRefreshToken = createRefreshToken(user);

    // Update refresh token in database
    user.refreshToken = newRefreshToken;
    await user.save();

    // Set new refresh token in cookie
    res.cookie("refreshToken", newRefreshToken, cookieOptions);

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
    console.error("Refresh token error:", err);
    res.status(500).json({
      message: err.message || "Error refreshing token"
    });
  }
};

export const logoutController = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      // Remove refresh token from database
      await User.updateOne(
        { refreshToken },
        { $unset: { refreshToken: 1 } }
      );
    }

    // Clear refresh token cookie
    res.clearCookie("accessToken", cookieOptions);
    res.clearCookie("refreshToken", {
      ...cookieOptions,
    });

    res.json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({
      message: err.message || "Error logging out"
    });
  }
};