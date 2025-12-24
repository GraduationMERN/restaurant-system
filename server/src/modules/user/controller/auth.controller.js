import admin from "../../../config/firebaseAdmin.js";
import User from "../model/User.js";
import { createAccessToken, createRefreshToken } from "../../../utils/jwt.js";
import jwt from "jsonwebtoken";

const isProduction = process.env.NODE_ENV === "production";

// Base cookie options. Use more restrictive SameSite in development for testing
// and enable `SameSite=None; Secure` in production for cross-site cookie usage.
const cookieOptionsBase = {
  httpOnly: true,
  sameSite: "Lax", // Changed from None to Lax for better compatibility
  secure: true, // Keep secure for HTTPS
  maxAge: 24 * 60 * 60 * 1000,
  path: "/", // Reverted back to "/"
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

    // Verify Firebase ID token
    const decoded = await admin.auth().verifyIdToken(token);
    const phoneNumber = decoded.phone_number;

    if (!phoneNumber) {
      return res.status(400).json({ message: "Phone number not found in token" });
    }

    // Find or create user
    let user = await User.findOne({ phoneNumber });

    if (!user) {
      user = await User.create({
        phoneNumber,
        isVerified: true,
        role: "customer",
      });
    } else {
      // Update verification status if not verified
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

    // Set refresh token in cookie
    res.cookie("refreshToken", refreshToken, cookieOptions);

    // Return user and access token
    res.json({
      user: {
        _id: user._id,
        name: user.name,
        phoneNumber: user.phoneNumber,
        role: user.role,
        avatarUrl: user.avatarUrl,
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
    const { name, phoneNumber } = req.body;

    if (!name || !phoneNumber) {
      return res.status(400).json({ 
        message: "Name and phone number are required" 
      });
    }

    // Find user by phone number
    const user = await User.findOne({ phoneNumber });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update user profile
    user.name = name;
    await user.save();

    // Generate new tokens
    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    res.cookie("refreshToken", refreshToken, cookieOptions);

    res.json({
      user: {
        _id: user._id,
        name: user.name,
        phoneNumber: user.phoneNumber,
        role: user.role,
        avatarUrl: user.avatarUrl,
        points: user.points,
        isVerified: user.isVerified,
      },
      accessToken,
    });
  } catch (err) {
    console.error("Complete profile error:", err);
    res.status(500).json({ 
      message: err.message || "Error completing profile" 
    });
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
      decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
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
    res.clearCookie("refreshToken", {
      httpOnly: true,
      sameSite: "Lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });

    res.json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ 
      message: err.message || "Error logging out" 
    });
  }
};