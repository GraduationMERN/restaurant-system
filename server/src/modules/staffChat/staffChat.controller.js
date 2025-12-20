import staffChatService from "./staffChat.service.js";

// Get all staff users
export const getStaffUsers = async (req, res) => {
  try {
    const users = await staffChatService.getStaffUsers();
    // Exclude current user
    const filtered = users.filter((u) => u._id.toString() !== req.user._id.toString());
    res.json({ success: true, data: filtered });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get user's conversations
export const getConversations = async (req, res) => {
  try {
    const conversations = await staffChatService.getConversationsForUser(req.user._id);
    res.json({ success: true, data: conversations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get or create private conversation
export const getOrCreatePrivate = async (req, res) => {
  try {
    const { userId } = req.params;
    const conversation = await staffChatService.getOrCreatePrivateConversation(
      req.user._id,
      userId
    );
    res.json({ success: true, data: conversation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get messages for a conversation
export const getMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const messages = await staffChatService.getMessages(id, req.user._id);
    res.json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Send a message
export const sendMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    
    if (!content?.trim()) {
      return res.status(400).json({ success: false, message: "Message content required" });
    }

    const message = await staffChatService.sendMessage(id, req.user._id, content.trim());
    res.json({ success: true, data: message });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mark messages as read
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    await staffChatService.markAsRead(id, req.user._id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
