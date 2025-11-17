import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const createToken = (user) => {
  const payload = {
    id: user._id.toString(),
    name: user.name,
    role: user.role,
    email: user.email,
  };
  return jwt.sign(payload, env.jwtKey, { expiresIn: env.expiry });
};
