import User from "../user/model/User.js";

// Get current user's profile
export async function getProfile(req, res) {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(userId).select("-password -refreshToken -otp -otpExpires -resetPasswordToken -resetPasswordExpires");
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Format response to match expected profile structure
    const nameParts = user.name?.split(" ") || [];
    const profile = {
      _id: user._id,
      firstName: nameParts[0] || "",
      lastName: nameParts.slice(1).join(" ") || "",
      displayName: user.name || "",
      email: user.email || "",
      phone: user.phoneNumber || "",
      bio: user.bio || "",
      avatarUrl: user.avatarUrl || "",
      role: user.role || "customer",
      address: user.address || {},
      points: user.points || 0,
      isVerified: user.isVerified || false,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    res.status(200).json({ success: true, profile });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Update user profile
export async function updateProfile(req, res) {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { firstName, lastName, displayName, phone, bio, address } = req.body;
    
    // Build update object
    const updateData = {};
    
    // Handle name - combine firstName/lastName or use displayName
    if (firstName !== undefined || lastName !== undefined) {
      const first = firstName || "";
      const last = lastName || "";
      updateData.name = `${first} ${last}`.trim();
    } else if (displayName !== undefined) {
      updateData.name = displayName;
    }
    
    if (phone !== undefined) updateData.phoneNumber = phone;
    if (bio !== undefined) updateData.bio = bio;
    if (address !== undefined) updateData.address = address;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }
    ).select("-password -refreshToken -otp -otpExpires -resetPasswordToken -resetPasswordExpires");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Format response
    const nameParts = user.name?.split(" ") || [];
    const profile = {
      _id: user._id,
      firstName: nameParts[0] || "",
      lastName: nameParts.slice(1).join(" ") || "",
      displayName: user.name || "",
      email: user.email || "",
      phone: user.phoneNumber || "",
      bio: user.bio || "",
      avatarUrl: user.avatarUrl || "",
      role: user.role || "customer",
      address: user.address || {},
      points: user.points || 0,
      isVerified: user.isVerified || false,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    res.status(200).json({ success: true, profile });
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Upload user avatar
export async function uploadAvatar(req, res) {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const url = req.file.path || `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { avatarUrl: url } },
      { new: true }
    ).select("-password -refreshToken -otp -otpExpires -resetPasswordToken -resetPasswordExpires");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Format response
    const nameParts = user.name?.split(" ") || [];
    const profile = {
      _id: user._id,
      firstName: nameParts[0] || "",
      lastName: nameParts.slice(1).join(" ") || "",
      displayName: user.name || "",
      email: user.email || "",
      phone: user.phoneNumber || "",
      bio: user.bio || "",
      avatarUrl: user.avatarUrl || "",
      role: user.role || "customer",
      address: user.address || {},
    };

    res.status(200).json({ 
      success: true, 
      avatarUrl: url, 
      profile 
    });
  } catch (error) {
    console.error("Error uploading user avatar:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
