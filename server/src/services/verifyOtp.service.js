import {
  findUserByEmail,
  saveRefreshToken,
} from "../repositories/user.repository.js";
import { createAccessToken } from "../utils/createAccessToken.js";
import { createRefreshToken } from "../utils/createRefreshToken.js";
export const verifyOtpService = async (email, code) => {
  const user = await findUserByEmail(email);
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  if (user.isVerified) {
    return { message: "User already verified" };
  }

  // Check OTP
  if (user.otp !== code) {
    const error = new Error("Invalid OTP");
    error.statusCode = 400;
    throw error;
  }

  // Check expiration
  if (user.otpExpires < Date.now()) {
    const error = new Error("OTP expired");
    error.statusCode = 400;
    throw error;
  }

  // Mark verified + clean OTP
  user.isVerified = true;
  user.otp = null;
  user.otpExpires = null;
  await user.save();

  // create token now
  const accessToken = createAccessToken(user);
  const refreshToken = createRefreshToken(user);
  saveRefreshToken(user._id, refreshToken);
  return { user, accessToken, refreshToken };
};
