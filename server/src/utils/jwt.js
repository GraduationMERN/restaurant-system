import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const createAccessToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role },
    env.jwtKey,
    { expiresIn: env.refreshExpiry }
  );

export const createRefreshToken = (user) =>
  jwt.sign(
    { id: user._id },
    env.refreshJwtKey,
    { expiresIn: env.refreshExpiry }
  );

export const createTempToken = (phoneNumber) =>
  jwt.sign(
    { phoneNumber },
    env.tempJwtKey,
    { expiresIn: "5m" }
  );