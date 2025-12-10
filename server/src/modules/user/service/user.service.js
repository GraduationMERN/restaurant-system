import { findAllUsers, findUserById, updateUserProfile } from "../repository/user.repository.js";

export const getAllUsersService = async () => {
  const users = await findAllUsers();
  return users;
};

export const getUserByIdService = async (id) => {
  const user = await findUserById(id);
  return user;
};

export const updateMeService = async (userId, payload) => {
  return await updateUserProfile(userId, payload);
};
