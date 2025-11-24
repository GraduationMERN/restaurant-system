import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const createRefreshToken = (user) => {
  const payload = {
    id: user._id.toString(),
  };
  return jwt.sign(payload, env.jwtKey, { expiresIn: env.refreshExpiry });
};
