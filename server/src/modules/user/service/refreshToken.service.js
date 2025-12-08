import jwt from "jsonwebtoken";
import { env } from "../../../config/env.js";
import {
  getUserByRefreshToken,
  saveRefreshToken,
} from "../repository/user.repository.js";
import { createAccessToken } from "../../../utils/createAccessToken.js";
import { createRefreshToken } from "../../../utils/createRefreshToken.js";

export const refreshTokenService = async (refreshToken) => {
  if (!refreshToken) {
    throw new Error("No refresh token provided");
  }
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, env.jwtKey);
  } catch (err) {
    throw new Error("Invalid refresh token");
  }

  const user = await getUserByRefreshToken(refreshToken);
  if (!user) {
    throw new Error("Refresh token not recognized");
  }

  // createAccessToken/createRefreshToken expect the full user object
  const newAccessToken = createAccessToken(user);
  const newRefreshToken = createRefreshToken(user);
  await saveRefreshToken(user._id, newRefreshToken);
  return { newAccessToken, newRefreshToken };
};
