import Support from "./support.model.js";

export async function submitSupport(req, res) {
  try {
    const { name, email, subject, type, message } = req.body || {};
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }
    const doc = await Support.create({ name, email, subject, type, message, user: req.user?._id });
    return res.status(201).json({ success: true, supportId: doc._id });
  } catch (err) {
    console.error("submitSupport error", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}
