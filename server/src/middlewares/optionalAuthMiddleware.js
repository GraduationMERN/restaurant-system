
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import User from "../modules/user/model/User.js";

const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies.accessToken;
    if (!token) return next(); // guest

    const decoded = jwt.verify(token, env.jwtKey);
    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user) return res.status(401).json({ message: "User not found" });
    next();
  } catch (err) {
    next(); // guest
  }
};
export default optionalAuthMiddleware;
