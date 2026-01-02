import admin from "../../../config/firebaseAdmin.js";
import User from "../model/User.js";
import { createAccessToken, createRefreshToken } from "../../../utils/jwt.js";
import jwt from "jsonwebtoken";
import { env } from "../../../config/env.js";


const isProduction = env.nodeEnv === "production";
// Base cookie options
const cookieOptionsBase = {
  httpOnly: isProduction,
  secure: isProduction,
  sameSite:  "Lax",
  maxAge: 15 * 60 * 1000,
  path: "/",
};

const cookieOptions = {
  ...cookieOptionsBase,
  ...(isProduction && process.env.COOKIE_DOMAIN ? { domain: process.env.COOKIE_DOMAIN } : {}),
};
export const firebaseLoginController = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    console.log('firebaseLoginController - received token:', !!token);
    if (token) {
      console.log('Token starts with:', token.substring(0, 50) + '...');
      // Try to decode without verification to see what's inside
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const decoded = JSON.parse(Buffer.from(parts[1], 'base64').toString());
          console.log('Token payload:', decoded);
        }
      } catch (e) {
        console.log('Could not parse token:', e.message);
      }
    }
    
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    // Verify Firebase ID token
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(token);
      console.log('Firebase token verified for UID:', decodedToken.uid);
    } catch (verifyErr) {
      console.error('Firebase token verification failed:', verifyErr?.message || verifyErr);
      return res.status(401).json({ message: "Invalid Firebase token: " + (verifyErr?.message || "unknown error") });
    }
    
    const {
      uid,
      phone_number,
      email,
      name,
      picture,
    } = decodedToken;

    // Find user by Firebase UID first, then by phone/email as fallback
    let user = await User.findOne({ firebaseUid: uid });

    if (!user) {
      // Check if user exists with this phone number or email
      const existingUser = await User.findOne({
        $or: [
          phone_number ? { phoneNumber: phone_number } : null,
          email ? { email: email } : null
        ].filter(Boolean)
      });

      if (existingUser) {
        // User exists but doesn't have firebaseUid - update it
        existingUser.firebaseUid = uid;
        existingUser.isVerified = true;
        
        // Update missing fields
        if (!existingUser.email && email) existingUser.email = email;
        if (!existingUser.name && name) existingUser.name = name;
        if (!existingUser.avatarUrl && picture) existingUser.avatarUrl = picture;
        
        await existingUser.save();
        user = existingUser;
      } else {
        // Create completely new user
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
    } else {
      // User exists with firebaseUid - update their info
      let needsUpdate = false;
      
      if (!user.isVerified) {
        user.isVerified = true;
        needsUpdate = true;
      }
      
      // Update missing fields from Firebase
      if (!user.email && email) {
        user.email = email;
        needsUpdate = true;
      }
      if (!user.name && name) {
        user.name = name;
        needsUpdate = true;
      }
      if (!user.avatarUrl && picture) {
        user.avatarUrl = picture;
        needsUpdate = true;
      }
      if (!user.phoneNumber && phone_number) {
        user.phoneNumber = phone_number;
        needsUpdate = true;
      }
      
      if (needsUpdate) {
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

    // Debug: log cookie setting confirmation (avoid printing full tokens)
    try {
      console.debug('Set accessToken cookie length:', accessToken?.length);
      console.debug('Set refreshToken cookie length:', refreshToken?.length);
      console.debug('Cookie options used:', cookieOptions);
    } catch (e) {
      // ignore
    }

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
    });
  } catch (err) {
    console.error("Firebase login error:", err && err.stack ? err.stack : err);
    res.status(500).json({
      message: err.message || "Internal server error"
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
    const refreshToken = req.cookies.refreshToken || req.headers.authorization?.split(" ")[1];

    // Debugging: log incoming cookies/headers when troubleshooting 401
    console.debug('Refresh token request cookies:', req.cookies);
    console.debug('Refresh token request headers Authorization:', req.headers.authorization);

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

    // Set new cookies: access (short) and refresh (long)
    res.cookie('accessToken', newAccessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });
    res.cookie('refreshToken', newRefreshToken, {
      ...cookieOptions,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
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