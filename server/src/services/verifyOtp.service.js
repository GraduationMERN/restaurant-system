import { findUserByEmail } from "../repositories/user.repository.js";
import { createToken } from "../utils/jwtGen.js";
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
  const token = createToken(user);

  return { user, token };
};
