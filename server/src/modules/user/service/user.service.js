import { 
  findAllUsers, 
  findUserById, 
  updateUserProfile, 
  updateUserRoleById, 
  updateUserAvatar,
  deleteUserById 
} from "../repository/user.repository.js";

const VALID_ROLES = ["customer", "admin", "kitchen", "cashier"];

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

export const updateUserRoleService = async (userId, role) => {
  if (!VALID_ROLES.includes(role)) {
    throw new Error("Invalid role");
  }
  const user = await updateUserRoleById(userId, role);
  if (!user) {
    throw new Error("User not found");
  }
  return user;
};

export const updateUserAvatarService = async (userId, avatarUrl) => {
  const user = await updateUserAvatar(userId, avatarUrl);
  if (!user) {
    throw new Error("User not found");
  }
  return user;
};

export const deleteUserService = async (userId) => {
  const user = await deleteUserById(userId);
  if (!user) {
    throw new Error("User not found");
  }
  return user;
};

