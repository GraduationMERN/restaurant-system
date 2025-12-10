import { env } from "../../../config/env.js";
import {
  forgetPasswordService,
  googleAuthService,
  loginUserService,
  logoutUserService,
  registerUserService,
  resetPasswordService,
} from "../service/auth.service.js";
import { refreshTokenService } from "../service/refreshToken.service.js";
import { verifyOtpService } from "../service/verifyOtp.service.js";
import orderModel from "../../order.module/orderModel.js";

const isProduction = process.env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: false,
  sameSite: isProduction ? "None" : "Lax",  // <- Lax for local
  secure: isProduction ? true : false,      // <- false for local
  maxAge: 24 * 60 * 60 * 1000,
  path: "/",
};
export const registerUserController = async (req, res) => {
  try {
    const { message } = await registerUserService(req.body);
    res.status(201).json({
      message,
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: err.message });
  }
};

export const loginUserController = async (req, res) => {
  try {
     console.log("=== LOGIN ATTEMPT ===");
    console.log("NODE_ENV:", process.env.NODE_ENV);
    console.log("Frontend URL:", env.frontendUrl);
    console.log("Request origin:", req.headers.origin);
    console.log("Request headers:", req.headers);
    console.log("Cookies received:", req.cookies);

    const { email, password } = req.body;
    const { user, accessToken, refreshToken } = await loginUserService(
      email,
      password
    );
    
    res.cookie("accessToken", accessToken, cookieOptions);
    res.cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    

    res.status(200).json({
      message: "Logged in successfully",
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        points: user.points,
        avatarUrl: user.avatarUrl,
        phoneNumber: user.phoneNumber,
        bio: user.bio,
        address: user.address,
      },
    });
  } catch (err) {
    console.error("Login error in production:", err.message);
    res.status(401).json({ message: err.message });
  }
};
export const getMe = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // Count completed orders for this user
    const completedOrders = await orderModel.countDocuments({
      user: user._id,
      status: "completed",
    });
    res.status(200).json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      points: user.points,
      orderCount: completedOrders, 
    });
    // Return full user document sans password (already excluded in middleware)
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
export const verifyOTP = async (req, res) => {
  try {
    const { email, code } = req.body;
    const { user, accessToken, refreshToken } = await verifyOtpService(
      email,
      code
    );
    res.cookie("accessToken", accessToken, cookieOptions);
    res.cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    res.status(201).json({
      message: "Registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        points: user.points,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: err.message });
  }
};
export const refreshTokenController = async (req, res) => {
  try {
    const { newAccessToken, newRefreshToken } = await refreshTokenService(
      req.cookies.refreshToken
    );
    res.cookie("accessToken", newAccessToken, cookieOptions);
    res.cookie("refreshToken", newRefreshToken, {
      ...cookieOptions,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({ message: "Token refreshed" });
  } catch (err) {
    res.status(401).json({ message: err.message });
  }
};
export const forgetPasswordController = async (req, res) => {
  try {
    const { email } = req.body;
    const { message } = await forgetPasswordService(email);
    res.status(200).json({ message });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
export const resetPasswordController = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const { message } = await resetPasswordService(token, newPassword);
    res.status(200).json({ message });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
export const googleCallbackController = async (req, res) => {
  const code = req.query.code;

  try {
    const { refreshToken, accessToken, user } = await googleAuthService(code);

    res.cookie("accessToken", accessToken, cookieOptions);
    res.cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    // Redirect to frontend instead of sending JSON
    res.redirect(
      `${env.frontendUrl}?name=${encodeURIComponent(
        user.name
      )}&email=${encodeURIComponent(user.email)}`
    );
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const logoutController = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    await logoutUserService(refreshToken);
    res.clearCookie("accessToken", cookieOptions);
    res.clearCookie("refreshToken", cookieOptions);
    return res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
