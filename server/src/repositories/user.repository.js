import mongoose from "mongoose";
import User from "../models/User.js";

export const findAllUsers = async () => {
  return await User.find().select("-password");
};

export const findUserById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return await User.findById(id).select("-password");
};

export const findUserByGoogleId = async (googleId) => {
  return User.findOne({ googleId });
};

export const findUserByEmail = async (email) => {
  return await User.findOne({ email });
};

export const findUserByResetToken = async (token) => {
  return await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() },
  });
};

export const addUser = async (user) => {
  return await User.create(user);
};

export const deleteRefreshToken = async (refreshToken) => {
  return await User.updateOne(
    { refreshToken },
    { $unset: { refreshToken: 1 } }
  );
};
export const saveRefreshToken = async (userId, token) => {
  await User.findByIdAndUpdate(userId, { refreshToken: token });
};

export const getUserByRefreshToken = async (token) => {
  return User.findOne({ refreshToken: token });
};
