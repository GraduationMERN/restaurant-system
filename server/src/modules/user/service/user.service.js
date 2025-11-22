import { findAllUsers, findUserById } from "../repository/user.repository.js";

export const getAllUsersService = async () => {
  const users = await findAllUsers();
  return users;
};

export const getUserByIdService = async (id) => {
  const user = await findUserById(id);
  return user;
};
