import { useEffect, useRef, useState, useCallback, memo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchStaffUsers,
  fetchConversations,
  fetchMessages,
  sendMessage,
  getOrCreatePrivateChat,
  setActiveConversation,
  clearActiveConversation,
  receiveNewMessage,
  setTyping,
  markAsRead,
} from "../../redux/slices/staffChatSlice";
import * as socketClient from "../../utils/socket";
import { useSettings } from "../../context/SettingContext";
import { useToast } from "../../hooks/useToast";
import "../chatbot/Chatbot.css";
import "./StaffChat.css";

// Icons (same as Chatbot)
const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const UsersIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m15 18-6-6 6-6" />
  </svg>
);

const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 19V5" />
    <path d="m5 12 7-7 7 7" />
  </svg>
);

// Get initials from name
const getInitials = (name) => {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
};

// Format time
const formatTime = (timestamp) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

// Get other participant from private chat - improved ID comparison
const getOtherParticipant = (conversation, currentUserId) => {
  if (!conversation || !conversation.participants) return null;
  
  // Normalize current user ID to string
  const normalizeId = (id) => {
    if (!id) return null;
    if (typeof id === "string") return id;
    if (id._id) return id._id.toString?.() || String(id._id);
    if (id.toString) return id.toString();
    return String(id);
  };
  
  const currentId = normalizeId(currentUserId);
  
  // Find participant that is NOT the current user
  const other = conversation.participants.find((p) => {
    const participantId = normalizeId(p.userId?._id || p.userId);
    return participantId && participantId !== currentId;
  });
  
  return other;
};

export default function StaffChat() {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const { staffUsers, conversations, activeConversation, messages, loading, messagesLoading, typingUsers } =
    useSelector((s) => s.staffChat);
  const { settings } = useSettings();

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [view, setView] = useState("list"); // "list" | "chat"
  const [selectedChatInfo, setSelectedChatInfo] = useState(null); // Store selected chat person info
  const [dataFetched, setDataFetched] = useState(false);

  const messagesRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const primaryColor = settings?.branding?.primaryColor || "#e85c41";

  // Check if staff
  const isStaff = user && ["admin", "cashier", "kitchen"].includes(user.role);
  const toast = useToast();
  
  // Fetch data once when component mounts (if staff)
  useEffect(() => {
    if (isStaff && !dataFetched) {
      dispatch(fetchConversations());
      dispatch(fetchStaffUsers());
      setDataFetched(true);
    }
  }, [isStaff, dataFetched, dispatch]);

  // Setup socket listeners
  useEffect(() => {
    if (!isStaff) return;

    const socket = socketClient.getSocket() || socketClient.initSocket();
    socketRef.current = socket;

    if (socket) {
      const handleNewMessage = (data) => {
        dispatch(receiveNewMessage(data));
        // Show toast if chat is closed
        if (!isOpen) {
          toast.showToast({
            message: `💬 ${data.message.senderName}: ${data.message.content.slice(0, 50)}`,
            type: "info",
          });
        }
      };

      socket.on("staffChat:newMessage", handleNewMessage);
      socket.on("staffChat:userTyping", (data) => dispatch(setTyping(data)));

      return () => {
        socket.off("staffChat:newMessage", handleNewMessage);
        socket.off("staffChat:userTyping");
      };
    }
  }, [isStaff, isOpen, dispatch, toast]);

  // Join conversation rooms
  useEffect(() => {
    const socket = socketRef.current;
    if (socket && conversations.length > 0 && user) {
      socket.emit("staffChat:join", { conversationIds: conversations.map((c) => c._id), userId: user._id });
    }
  }, [conversations, user]);

  // Scroll to bottom
  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle open chat with staff member
  const handleSelectStaff = useCallback(async (staffUser) => {
    // Store the staff info directly for header display
    setSelectedChatInfo({
      name: staffUser.name,
      avatar: staffUser.avatarUrl,
      role: staffUser.role,
    });
    
    const result = await dispatch(getOrCreatePrivateChat(staffUser._id));
    if (result.payload) {
      dispatch(setActiveConversation(result.payload));
      dispatch(fetchMessages(result.payload._id));
      setView("chat");
    }
  }, [dispatch]);

  // Handle select existing conversation
  const handleSelectConversation = useCallback((conv) => {
    // Get other participant info for header
    const other = getOtherParticipant(conv, user._id);
    setSelectedChatInfo({
      name: other?.userId?.name || "Chat",
      avatar: other?.userId?.avatarUrl,
      role: other?.userId?.role || other?.role,
    });
    
    dispatch(setActiveConversation(conv));
    dispatch(fetchMessages(conv._id));
    // Mark messages as read
    if (conv.unreadCount > 0) {
      dispatch(markAsRead(conv._id));
    }
    setView("chat");
  }, [dispatch, user]);

  // Handle back
  const handleBack = useCallback(() => {
    dispatch(clearActiveConversation());
    setSelectedChatInfo(null);
    setView("list");
  }, [dispatch]);

  // Handle send
  const handleSend = useCallback(() => {
    if (!input.trim() || !activeConversation) return;
    dispatch(sendMessage({ conversationId: activeConversation._id, content: input.trim() }));
    setInput("");

    // Stop typing
    const socket = socketRef.current;
    if (socket && typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      socket.emit("staffChat:typing", { conversationId: activeConversation._id, userId: user._id, userName: user.name, isTyping: false });
    }
  }, [input, activeConversation, dispatch, user]);

  // Handle typing
  const handleInputChange = (e) => {
    setInput(e.target.value);
    const socket = socketRef.current;
    if (socket && activeConversation) {
      socket.emit("staffChat:typing", { conversationId: activeConversation._id, userId: user._id, userName: user.name, isTyping: true });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("staffChat:typing", { conversationId: activeConversation._id, userId: user._id, userName: user.name, isTyping: false });
      }, 2000);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isStaff) return null;

  // Filter out self from staff list
  const currentId = user?._id?.toString?.() || user?._id;
  const filteredStaff = staffUsers.filter((s) => (s._id?.toString?.() || s._id) !== currentId);

  // Get typing users for active conversation
  const typingList = activeConversation ? typingUsers[activeConversation._id] || [] : [];
  const typingText = typingList.map((u) => u.userName).join(", ");

  // De-duplicate conversations - keep only the most recent one per participant pair
  const getUniqueConversations = () => {
    const seen = new Map();
    return conversations.filter((conv) => {
      const other = getOtherParticipant(conv, user._id);
      const otherId = other?.userId?._id || other?.userId;
      if (!otherId) return false;
      const key = String(otherId);
      if (seen.has(key)) return false;
      seen.set(key, true);
      return true;
    });
  };
  const uniqueConversations = getUniqueConversations();

  // Calculate total unread messages for badge
  const totalUnread = uniqueConversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);

  // Render chat header info - use stored selectedChatInfo
  const getChatHeaderInfo = () => {
    if (selectedChatInfo) return selectedChatInfo;
    if (!activeConversation) return { name: "", avatar: null, role: "" };
    const other = getOtherParticipant(activeConversation, user._id);
    return {
      name: other?.userId?.name || "Chat",
      avatar: other?.userId?.avatarUrl,
      role: other?.userId?.role || other?.role,
    };
  };

  const chatInfo = getChatHeaderInfo();

  return (
    <div className={`staff-chat-container ${isOpen ? "active" : ""}`} style={{ "--cb-primary": primaryColor }}>
      {/* Chat Window */}
      <div className="staff-chat-window chatbot-window">
        {view === "list" ? (
          <>
            {/* List Header */}
            <div className="chatbot-header">
              <div className="bot-avatar" style={{ background: `linear-gradient(135deg, ${primaryColor}, #764ba2)` }}>
                <UsersIcon />
              </div>
              <div className="header-info">
                <h3>Team Chat</h3>
                <p>{filteredStaff.length} team members</p>
              </div>
              <button className="header-close-btn" onClick={() => setIsOpen(false)}>
                <CloseIcon />
              </button>
            </div>

            {/* Contact List */}
            <div className="chatbot-messages" style={{ padding: 0 }}>
              {loading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
                  <div className="typing-indicator">
                    <span className="dot"></span>
                    <span className="dot"></span>
                    <span className="dot"></span>
                  </div>
                </div>
              ) : (
                <>
                  {/* Recent Conversations */}
                  {uniqueConversations.length > 0 && (
                    <div className="staff-chat-section">
                      <div className="staff-chat-section-title">Recent Chats</div>
                      {uniqueConversations.map((conv) => {
                        const other = getOtherParticipant(conv, user._id);
                        const hasUnread = conv.unreadCount > 0;
                        return (
                          <div 
                            key={conv._id} 
                            className={`staff-chat-item ${hasUnread ? "unread" : ""}`}
                            onClick={() => handleSelectConversation(conv)}
                          >
                            <div className="staff-chat-avatar">
                              {other?.userId?.avatarUrl ? (
                                <img src={other.userId.avatarUrl} alt="" />
                              ) : (
                                <span>{getInitials(other?.userId?.name)}</span>
                              )}
                            </div>
                            <div className="staff-chat-item-info">
                              <div className="staff-chat-item-name">{other?.userId?.name || "Unknown"}</div>
                              <div className="staff-chat-item-preview">
                                {conv.lastMessage?.content || "No messages yet"}
                              </div>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                              {conv.lastMessage && (
                                <div className="staff-chat-item-time">{formatTime(conv.lastMessage.timestamp)}</div>
                              )}
                              {hasUnread && (
                                <span className="staff-chat-unread-count">{conv.unreadCount}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* All Staff */}
                  <div className="staff-chat-section">
                    <div className="staff-chat-section-title">All Staff</div>
                    {filteredStaff.map((staff) => (
                      <div key={staff._id} className="staff-chat-item" onClick={() => handleSelectStaff(staff)}>
                        <div className="staff-chat-avatar">
                          {staff.avatarUrl ? (
                            <img src={staff.avatarUrl} alt="" />
                          ) : (
                            <span>{getInitials(staff.name)}</span>
                          )}
                        </div>
                        <div className="staff-chat-item-info">
                          <div className="staff-chat-item-name">{staff.name}</div>
                          <div className="staff-chat-item-role">{staff.role}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Chat Header */}
            <div className="chatbot-header">
              <button className="header-back-btn" onClick={handleBack}>
                <BackIcon />
              </button>
              <div className="bot-avatar" style={{ background: `linear-gradient(135deg, ${primaryColor}, #764ba2)` }}>
                {chatInfo.avatar ? (
                  <img src={chatInfo.avatar} alt="" />
                ) : (
                  <span style={{ color: "white", fontWeight: 600 }}>{getInitials(chatInfo.name)}</span>
                )}
              </div>
              <div className="header-info">
                <h3>{chatInfo.name}</h3>
                <p>{typingText ? `${typingText} typing...` : chatInfo.role || "Staff"}</p>
              </div>
              <button className="header-close-btn" onClick={() => setIsOpen(false)}>
                <CloseIcon />
              </button>
            </div>

            {/* Messages */}
            <div className="chatbot-messages" ref={messagesRef}>
              {messagesLoading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
                  <div className="typing-indicator">
                    <span className="dot"></span>
                    <span className="dot"></span>
                    <span className="dot"></span>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: "center", padding: 40, color: "var(--cb-text-light)" }}>
                  No messages yet. Say hello! 👋
                </div>
              ) : (
                messages.map((msg) => {
                  // Properly extract sender ID (handles object or string)
                  const msgSenderId = msg.senderId?._id?.toString?.() || msg.senderId?._id || msg.senderId?.toString?.() || String(msg.senderId);
                  const isMe = msgSenderId === currentId;
                  return (
                    <div key={msg._id} className={`message ${isMe ? "user-message" : "bot-message"}`}>
                      <div className="message-content-wrapper">
                        {/* Show sender name for received messages */}
                        {!isMe && msg.senderName && (
                          <span style={{ fontSize: 11, color: primaryColor, marginBottom: 2, display: "block" }}>
                            {msg.senderName}
                          </span>
                        )}
                        <div className="bubble" style={isMe ? { background: primaryColor } : {}}>
                          {msg.content}
                        </div>
                        <span className="message-time">{formatTime(msg.createdAt)}</span>
                      </div>
                    </div>
                  );
                })
              )}

              {typingText && (
                <div className="message bot-message">
                  <div className="typing-indicator">
                    <span className="dot"></span>
                    <span className="dot"></span>
                    <span className="dot"></span>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="chatbot-input-area">
              <div className="input-container">
                <div className="input-wrapper">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={input}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                  />
                </div>
                <div className="input-actions">
                  <button
                    className="send-btn"
                    onClick={handleSend}
                    disabled={!input.trim()}
                    style={{ backgroundColor: primaryColor }}
                  >
                    <SendIcon />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Toggle Button */}
      <button
        className="staff-chat-toggle"
        onClick={() => setIsOpen(!isOpen)}
        style={{ backgroundColor: primaryColor }}
      >
        <span className="toggle-icon users-icon">
          <UsersIcon />
        </span>
        <span className="toggle-icon close-icon">
          <CloseIcon />
        </span>
        {/* Unread Badge */}
        {totalUnread > 0 && !isOpen && (
          <span className="staff-chat-badge">{totalUnread > 99 ? "99+" : totalUnread}</span>
        )}
      </button>
    </div>
  );
}
