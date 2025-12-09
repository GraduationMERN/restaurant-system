import mongoose from "mongoose";
import User from "../model/User.js";

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

// increment user's points safely, optionally using a mongoose session
export const incrementUserPoints = async (userId, points, session = null) => {
  const opts = {};
  if (session) opts.session = session;
  // Use atomic $inc to avoid race conditions
  return await User.findByIdAndUpdate(userId, { $inc: { points } }, { new: true, ...opts }).exec();
};

// decrement user's points safely, optionally using a mongoose session
export const decrementUserPoints = async (userId, points, session = null) => {
  // Use a conditional update to ensure we don't dip below 0 in a race condition
  const query = { _id: userId, points: { $gte: points } };
  const update = { $inc: { points: -points } };
  const opts = { new: true };
  if (session) opts.session = session;
  const updated = await User.findOneAndUpdate(query, update, opts).exec();
  if (!updated) return null; // indicates insufficient points or user not found
  return updated;
};

export const updateUserProfile = async (userId, updates) => {
  const allowed = [
    "name",
    "phoneNumber",
    "bio",
    "socialLinks",
    "address",
  ];
  const payload = {};
  for (const key of allowed) {
    if (updates[key] !== undefined) payload[key] = updates[key];
  }
  return await User.findByIdAndUpdate(userId, payload, { new: true }).select("-password");
};
