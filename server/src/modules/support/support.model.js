import mongoose from "mongoose";

const SupportSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    subject: { type: String, required: true },
    type: { type: String, enum: ["feedback", "complaint", "other"], default: "feedback" },
    message: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
  },
  { timestamps: true }
);

export default mongoose.model("Support", SupportSchema);
