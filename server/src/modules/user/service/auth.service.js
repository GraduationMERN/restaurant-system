import crypto from "crypto";
import {
  addUser,
  deleteRefreshToken,
  findUserByEmail,
  findUserByGoogleId,
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
  const userRole = user.role || "customer";
  const exists = await User.findOne({ email });
  if (exists) {
    const error = new Error("Email already exists");
    error.statusCode = 409;
    throw error;
  }
  const hashedPassword = await hashPassword(password);
  const code = userRole === "customer" ? generateOTP() : null;
  
  console.log("Generated OTP:", code);
  
  const newUser = await addUser({
    ...user,
    role: userRole, 
    password: hashedPassword,
    otp: code,
    isVerified: userRole === "customer" ? false : true,
  });
  
   if (userRole === "customer") {
    // Send email in background WITHOUT waiting
    sendOTPEmailInBackground(email, code, newUser.name);
    
    return {
      newUser,
      message: "Account created! Please check your email for OTP.",
      // Return OTP for development/testing (remove in production)
      otp: process.env.NODE_ENV === "development" ? code : undefined
    };
  }
  
  return { newUser, message: "Registered successfully" };
};

async function sendOTPEmailInBackground(email, code, name) {
  setTimeout(async () => {
    try {
      console.log("Background: Sending OTP email to", email);
      
      const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Welcome to Bella Vista, ${name}!</h2>
          <p>Your verification code is:</p>
          <h1 style="color: #FF6B35; font-size: 32px;">${code}</h1>
          <p>Valid for 10 minutes.</p>
        </div>
      `;
      
      await sendEmail(email, "Your Verification Code", `Code: ${code}`, html);
      console.log("Background: Email sent successfully to", email);
      
    } catch (error) {
      console.error("Background: Failed to send email:", error.message);
      // Log to error tracking service
    }
  }, 100); // Small delay to not block response
}

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
