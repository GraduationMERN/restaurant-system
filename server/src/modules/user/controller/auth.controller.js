import { env } from "../../../config/env.js";
import {
  forgetPasswordService,
  loginUserService,
  logoutUserService,
  registerUserService,
  resetPasswordService,
} from "../service/auth.service.js";
import { refreshTokenService } from "../service/refreshToken.service.js";
import { verifyOtpService } from "../service/verifyOtp.service.js";

const cookieOptions = {
  httpOnly: true,
  secure: true,
  maxAge: 24 * 60 * 60 * 1000,
  sameSite: "none",
};

export const registerUserController = async (req, res) => {
  try {
    // const { newUser, token } = await registerUserService(req.body);
    // res.cookie("token", token, {
    //   httpOnly: true,
    //   secure: true,
    //   maxAge: 24 * 60 * 60 * 1000,
    //   sameSite: "none",
    // });
    const { message } = await registerUserService(req.body);
    res.status(201).json({
      message: "Registered successfully",
      user: {
        message,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: err.message });
  }
};

export const loginUserController = async (req, res) => {
  try {
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
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    res.status(401).json({ message: err.message });
  }
};
export const getMe = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
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

    res.status(200).json({
      message: "Logged in successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });

    res.redirect(env.frontendUrl);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
export const logoutController = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    await logoutUserService(refreshToken);
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    return res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
