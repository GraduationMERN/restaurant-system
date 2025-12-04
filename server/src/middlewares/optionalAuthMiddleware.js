
// import jwt from "jsonwebtoken";
// import { env } from "../config/env.js";
// import User from "../modules/user/model/User.js";

// const optionalAuthMiddleware = async (req, res, next) => {
//   try {
//     const token = req.cookies.accessToken;
//     if (!token) return next(); // guest

//     const decoded = jwt.verify(token, env.jwtKey);
//     req.user = await User.findById(decoded.id).select("-password");
//     if (!req.user) return res.status(401).json({ message: "User not found" });
//     next();
//   } catch (err) {
//     next(); // guest
//   }
// };
// export default optionalAuthMiddleware;


// src/middleware/optionalAuthMiddleware.js
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
// import User from "../user/model/User.js";
import User from "../modules/user/model/User.js";

const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies.accessToken;
    
    // Debug logging
    console.log("=== OPTIONAL AUTH MIDDLEWARE ===");
    console.log("Has token?", !!token);
    console.log("Cookies:", req.cookies);
    
    if (!token) {
      // Guest user - create guest user object
      req.user = {
        _id: null,
        isGuest: true,
        role: 'guest'
      };
      console.log("No token - treating as guest");
      return next();
    }

    // Verify token
    const decoded = jwt.verify(token, env.jwtKey);
    
    console.log("Token decoded successfully");
    console.log("Token ID:", decoded.id);
    console.log("Is UUID?", decoded.id?.includes?.('-'));
    console.log("Is ObjectId?", /^[0-9a-fA-F]{24}$/.test(decoded.id || ''));
    
    // Try to find user by ID from token
    let user;
    try {
      user = await User.findById(decoded.id).select("-password");
    } catch (findError) {
      console.log("User.findById failed:", findError.message);
      user = null;
    }
    
    if (!user) {
      console.log("User not found in database, treating as guest");
      // Create guest user with token info
      req.user = {
        _id: null,
        isGuest: true,
        role: 'guest',
        tokenId: decoded.id, // Keep token ID for debugging
        email: decoded.email,
        name: decoded.name
      };
    } else {
      console.log("User found:", user._id, user.email);
      req.user = user;
      req.user.isGuest = false;
    }
    
    next();
    
  } catch (err) {
    console.error("Optional auth middleware error:", err.message);
    // Any error - treat as guest
    req.user = {
      _id: null,
      isGuest: true,
      role: 'guest'
    };
    next();
  }
};

export default optionalAuthMiddleware;