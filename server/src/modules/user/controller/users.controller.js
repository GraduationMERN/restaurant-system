import {
  getAllUsersService,
  getUserByIdService,
  updateMeService,
  updateUserRoleService,
  updateUserAvatarService,
  deleteUserService,
} from "../service/user.service.js";

export const getAllUsers = async (req, res) => {
  try {
    const users = await getAllUsersService();
    res.status(200).json({ users });
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await getUserByIdService(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ user });
  } catch (err) {
    console.log(err);
    res.status(404).json({ message: err.message });
  }
};

export const updateMe = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const updated = await updateMeService(userId, req.body || {});
    return res.status(200).json({ user: updated });
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: err.message });
  }
};

export const updateMyAvatar = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    
    const url = req.file.path || `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    const user = await updateUserAvatarService(userId, url);
    
    return res.status(200).json({ success: true, avatarUrl: url, user });
  } catch (err) {
    console.error("updateMyAvatar error", err);
    res.status(500).json({ message: err.message || "Internal server error" });
  }
};

// Update user role (Admin only)
export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const user = await updateUserRoleService(id, role);
    res.status(200).json({ success: true, user });
  } catch (err) {
    console.error("updateUserRole error", err);
    const statusCode = err.message === "Invalid role" ? 400 : 
                       err.message === "User not found" ? 404 : 500;
    res.status(statusCode).json({ message: err.message });
  }
};

// Delete user (Admin only)
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await deleteUserService(id);
    res.status(200).json({ success: true, message: "User deleted successfully" });
  } catch (err) {
    console.error("deleteUser error", err);
    const statusCode = err.message === "User not found" ? 404 : 500;
    res.status(statusCode).json({ message: err.message });
  }
};
