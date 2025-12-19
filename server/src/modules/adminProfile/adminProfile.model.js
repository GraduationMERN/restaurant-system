import mongoose from "mongoose";

const adminProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    firstName: { type: String, default: "" },
    lastName: { type: String, default: "" },
    displayName: { type: String, default: "" },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
    bio: { type: String, default: "" },
    avatarUrl: { type: String, default: "" },
    address: {
      country: { type: String, default: "" },
      cityState: { type: String, default: "" },
      postalCode: { type: String, default: "" },
      taxId: { type: String, default: "" },
    },
    preferences: {
      language: { type: String, default: "en" },
      timezone: { type: String, default: "UTC" },
      notifications: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

const AdminProfile = mongoose.model("AdminProfile", adminProfileSchema);
export default AdminProfile;
