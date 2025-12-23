import twilio from "twilio";
import { env } from "../../../config/env";
import User from "../model/User.js";
import jwt from "jsonwebtoken";
import {
  createAccessToken,
  createRefreshToken,
  createTempToken,
} from "../utils/jwt.js";

const client = twilio(env.twilioAccSID, env.twilioAuthToken)

export async function startAuthServices(phoneNumber) {
  await client.verify.v2
    .services(env.twilioVerifySID)
    .verifications.create({
      to: phoneNumber,
      channel: "sms",
    });

  return { message: "OTP sent" };
}


export async function verifyOTPServices(otp, phoneNumber) {
  const check = await client.verify.v2
    .services(env.twilioVerifySID)
    .verificationChecks.create({
      to: phoneNumber,
      code: otp,
    });

  if (check.status !== "approved") {
    throw new Error("Invalid OTP");
  }

  const user = await User.findOne({ phoneNumber });

  // 🔁 Existing user
  if (user) {
    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);

    user.refreshToken = refreshToken;
    user.isVerified = true;
    await user.save();

    return {
      isNewUser: false,
      accessToken,
      refreshToken,
      user,
    };
  }

  // 🆕 New user
  const tempToken = createTempToken(phoneNumber);

  return {
    isNewUser: true,
    tempToken,
  };
}

export async function completeProfileServices(name, tempToken) {
  const decoded = jwt.verify(tempToken, process.env.TEMP_JWT_SECRET);

  const existing = await User.findOne({ phoneNumber: decoded.phoneNumber });
  if (existing) throw new Error("User already exists");

  const user = await User.create({
    name,
    phoneNumber: decoded.phoneNumber,
    isVerified: true,
  });

  const accessToken = createAccessToken(user);
  const refreshToken = createRefreshToken(user);

  user.refreshToken = refreshToken;
  await user.save();

  return {
    accessToken,
    refreshToken,
    user,
  };
}

export async function getMeServices(token) {
  //check the token in the cookies and get user by token ?
}

export async function refreshTokenServices(accessToken) {
  // check if refreshToken is exist and generate a new accessToken

  //replace the new access with the old one
}

export async function logoutServices(accessToken, refreshToken) {
  //remove token from cookies
}