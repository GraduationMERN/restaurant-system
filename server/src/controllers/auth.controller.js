import {
  loginUserService,
  registerUserService,
} from "../services/auth.service.js";
import { verifyOtpService } from "../services/verifyOtp.service.js";

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
    const { user, token } = await loginUserService(email, password);
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: "none",
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
    const { user, token } = await verifyOtpService(email, code);
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: "none",
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
