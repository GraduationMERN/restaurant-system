import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "../src/config/db.js";
import User from "../src/modules/user/model/User.js";
import bcrypt from "bcryptjs";

dotenv.config();

const run = async () => {
  try {
    await connectDB();

    const email = "admin@platform.com";
    const existing = await User.findOne({ email });
    if (existing) {
      console.log("Super admin already exists:", existing._id.toString());
      process.exit(0);
    }

    // Create a firebaseUid placeholder and hashed password saved in refreshToken (not ideal but works for local admin)
    const firebaseUid = `supadmin-${Date.now()}`;
    const password = "ChangeMe123!";
    const hashed = await bcrypt.hash(password, 10);

    const user = new User({
      name: "Platform Super Admin",
      email,
      firebaseUid,
      role: "super_admin",
      restaurantId: null,
      refreshToken: hashed,
    });

    await user.save();
    console.log("Created super admin:", user._id.toString());
    console.log("Email:", email);
    console.log("Password:", password, "(please change immediately)");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
