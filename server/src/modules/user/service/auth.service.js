import crypto from "crypto";
import {
  addUser,
  deleteRefreshToken,
  findUserByEmail,
  findUserByResetToken,
  saveRefreshToken,
} from "../repository/user.repository.js";
import bcrypt from "bcryptjs";
import { createAccessToken } from "../../../utils/createAccessToken.js";
import User from "../model/User.js";
import { generateOTP } from "../../../utils/otpGen.js";
import { sendEmail } from "../../../utils/Mailer.js";
import { createRefreshToken } from "../../../utils/createRefreshToken.js";
import { env } from "../../../config/env.js";
import {
  decodeGoogleIdToken,
  exchangeGoogleCodeForTokens,
} from "../../../utils/google.js";

export const registerUserService = async (user) => {
  const { name, email, password, phoneNumber } = user;
  if (!name || !email || !password || !phoneNumber) {
    const error = new Error("Name, email, password, phoneNumber are required");
    error.statusCode = 400;
    throw error;
  }
  const exists = await User.findOne({ email });
  if (exists) {
    const error = new Error("Email already exists");
    error.statusCode = 409;
    throw error;
  }
  const hashedPassword = await hashPassword(password);
  const code = generateOTP();
  const newUser = await addUser({
    ...user,
    password: hashedPassword,
    otp: code,
  });
  await sendEmail(
    email,
    "Your OTP Code",
    `Your verification code is ${code}, Valid for 10 minutes`
  );
  return { message: "OTP sent to email. Please verify your account." };
};

export const loginUserService = async (email, password) => {
  const user = await findUserByEmail(email);
  if (!user) {
    throw new Error("Invalid email or password");
  }
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }

  const accessToken = createAccessToken(user);
  const refreshToken = createRefreshToken(user);
  saveRefreshToken(user._id, refreshToken);
  return { user, accessToken, refreshToken };
};

export const logoutUserService = async (refreshToken) => {
  await deleteRefreshToken(refreshToken);
};

export const forgetPasswordService = async (email) => {
  const user = await findUserByEmail(email);
  if (!user) {
    throw new Error("Invalid email");
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
  await user.save();
  const resetURL = `${env.frontendUrl}/reset-password?token=${resetToken}`;

  await sendEmail(
    user.email,
    "Password reset request",
    `Reset your password using this link: ${resetURL}`
  );
  return { message: "Password reset link sent to email" };
};

export const resetPasswordService = async (token, newPassword) => {
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const user = await findUserByResetToken(hashedToken);
  if (!user) {
    throw new Error("Invalid or expired token");
  }
  user.password = await hashPassword(newPassword);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();
  return { message: "Password reset successful" };
};

export const googleAuthService = async (code) => {
  const { id_token } = await exchangeGoogleCodeForTokens(code);

  const googleUser = decodeGoogleIdToken(id_token);

  let user = await findUserByGoogleId(googleUser.sub);

  if (!user) {
    const existingEmailUser = await findUserByEmail(googleUser.email);

    if (existingEmailUser) {
      throw new Error("Email already registered without Google");
    }

    user = await addUser({
      googleId: googleUser.sub,
      email: googleUser.email,
      name: googleUser.name,
    });
  }

  // Step 5: create JWT for your app
  const accessToken = createAccessToken(user);
  const refreshToken = createRefreshToken(user);
  saveRefreshToken(user._id, refreshToken);
  return { accessToken, refreshToken, user };
};

const hashPassword = async (password) => {
  const saltRounds = 10;
  const hashed = await bcrypt.hash(password, saltRounds);
  return hashed;
};
