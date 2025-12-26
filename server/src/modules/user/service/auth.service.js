import User from "../model/User.js";
import jwt from "jsonwebtoken";
import {createAccessToken,createRefreshToken} from "../../../utils/jwt.js";

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