import User from "../models/User.js";

export const findUserByEmail = async (email) => {
  return await User.findOne({ email });
};

export const addUser = async (user) => {
  return await User.create(user);
};
