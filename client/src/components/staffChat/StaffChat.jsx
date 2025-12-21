import { useEffect, useRef, useState, useCallback, memo, useMemo } from "react";
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
  deleteConversation,
  uploadAttachment,
} from "../../redux/slices/staffChatSlice";
import * as socketClient from "../../utils/socket";
import { useSettings } from "../../context/SettingContext";
import { useToast } from "../../hooks/useToast";
import ScrollToTopButton from "../common/ScrollToTopButton";
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

const ImageIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
    <circle cx="9" cy="9" r="2" />
    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
  </svg>
);

const EmojiIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
    <line x1="9" x2="9.01" y1="9" y2="9" />
    <line x1="15" x2="15.01" y1="9" y2="9" />
  </svg>
);

const GifIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <text x="6" y="16" fontSize="8" fontWeight="bold" fill="currentColor" stroke="none">GIF</text>
  </svg>
);

const MicIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" x2="12" y1="19" y2="22" />
  </svg>
);

const StopIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="6" width="12" height="12" rx="2" />
  </svg>
);

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

// Common Emojis data (Synced with Chatbot)
const EMOJI_CATEGORIES = {
  "Frequently Used": ["👍", "👎", "😢", "🙂", "😐", "😊", "🤩"],
  "Smileys & Emotion": ["😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "😊", "😇", "🥰", "😍", "🤩", "😘", "😗", "😚", "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🤫", "🤔", "🤐", "🤨", "😐", "😑", "😶", "😏", "😒", "🙄", "😬", "😮‍💨", "🤥"],
  "Gestures": ["👋", "🤚", "🖐️", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "👇", "☝️", "👍", "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", "🤝", "🙏"],
  "Food & Drink": ["🍏", "🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐", "🍈", "🍒", "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🍆", "🥑", "🥦", "🥬", "🥒", "🌶️", "🫑", "🌽", "🥕", "🧄", "🧅", "🥔", "🍔", "🍟", "🍕", "🌭", "🥪", "🌮", "🌯", "🫔", "🥙", "🧆"],
};

const TrashIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

// Get initials from name
const getInitials = (name) => {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
};

// Helper to parse message content with Markdown support
const MessageParser = ({ content }) => {
  if (!content) return null;

  const lines = content.split("\n");
  const blocks = [];
  let currentBlock = null;

  const flushBlock = () => {
    if (currentBlock) {
      blocks.push(currentBlock);
      currentBlock = null;
    }
  };

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushBlock();
      return;
    }

    // Check for Markdown Image ![alt](url)
    const mdImgRegex = /!\[([^\]]*)\]\(([^)]+)\)/;
    const mdImgMatch = line.match(mdImgRegex);
    if (mdImgMatch) {
      flushBlock();
      const textBefore = line.substring(0, mdImgMatch.index).trim();
      const textAfter = line.substring(mdImgMatch.index + mdImgMatch[0].length).trim();
      const alt = mdImgMatch[1];
      const url = mdImgMatch[2];

      if (textBefore) {
        blocks.push({ type: "text", content: textBefore });
      }

      if (alt === "Voice") {
        blocks.push({ type: "voice", url: url });
      } else if (alt.startsWith("File:")) {
        const fileName = alt.substring(5);
        blocks.push({ type: "file", url: url, fileName: fileName });
      } else {
        blocks.push({ type: "image", url: url, alt: alt });
      }

      if (textAfter) {
        blocks.push({ type: "text", content: textAfter });
      }
      return;
    }

    // Default to Text
    if (!currentBlock || currentBlock.type !== "text") {
      flushBlock();
      currentBlock = { type: "text", content: line };
    } else {
      currentBlock.content += "\n" + line;
    }
  });
  flushBlock();

  const renderInline = (text) => {
    // Simple bold support
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <>
      {blocks.map((block, idx) => {
        if (block.type === "text") {
          return (
            <div key={idx} className="content-text" style={{ whiteSpace: "pre-wrap" }}>
              {renderInline(block.content)}
            </div>
          );
        }
        if (block.type === "image") {
          return (
            <div key={idx} className="content-image-wrapper">
              <img
                src={block.url}
                alt={block.alt || "Content"}
                className="content-image"
                style={{ maxWidth: "100%", borderRadius: "8px", marginTop: 4 }}
              />
            </div>
          );
        }
        if (block.type === "voice") {
          return (
            <div key={idx} className="content-voice-wrapper" style={{ marginTop: 4 }}>
              <audio controls src={block.url} style={{ maxWidth: "100%", height: 40 }} />
            </div>
          );
        }
        if (block.type === "file") {
          return (
            <div key={idx} className="content-file-wrapper" style={{ marginTop: 4 }}>
              <a
                href={block.url}
                target="_blank"
                rel="noopener noreferrer"
                className="file-attachment"
              >
                <span>📄</span>
                <span style={{ textDecoration: "underline" }}>{block.fileName}</span>
              </a>
            </div>
          );
        }
        return null;
      })}
    </>
  );
};

// Emoji Picker Component
const EmojiPicker = ({ onSelect, onClose }) => {
  const [search, setSearch] = useState("");
  const pickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const filteredEmojis = useMemo(() => {
    if (!search) return EMOJI_CATEGORIES;
    const filtered = {};
    Object.entries(EMOJI_CATEGORIES).forEach(([category, emojis]) => {
      const matching = emojis.filter(e => e.includes(search));
      if (matching.length) filtered[category] = matching;
    });
    return filtered;
  }, [search]);

  return (
    <div className="picker-popup emoji-picker" ref={pickerRef}>
      <div className="picker-search">
        <SearchIcon />
        <input
          type="text"
          placeholder="Search emoji..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />
      </div>
      <div className="picker-content">
        {Object.entries(filteredEmojis).map(([category, emojis]) => (
          <div key={category} className="emoji-category">
            <div className="category-title">{category.toUpperCase()}</div>
            <div className="emoji-grid">
              {emojis.map((emoji, idx) => (
                <button
                  key={idx}
                  className="emoji-btn"
                  onClick={() => onSelect(emoji)}
                  type="button"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// GIF Picker Component
const GifPicker = ({ onSelect, onClose }) => {
  const [search, setSearch] = useState("");
  const [gifs, setGifs] = useState([]);
  const [loading, setLoading] = useState(false);
  const pickerRef = useRef(null);

  // Sample trending GIFs
  const trendingGifs = [
    "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMTV2ZTBhdzFmbmJieXFvaW9ienBjbndxMmlsemN6OWN6ODdhZTZjeiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/L3UFa9OvkOjA6c16Xn/giphy.gif",
    "https://media.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3amtkOW5panE2MHU0bXQzano3cGx4MnQwY3NjaXdsc2s3c251dno0YSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/wjEQMRyynvrdx5g7Mn/giphy.gif",
    "https://media.giphy.com/media/xT5LMHxhOfscxPfIfm/giphy.gif",
    "https://media.giphy.com/media/26gsspfbt1HfVQ9va/giphy.gif",
    "https://media.giphy.com/media/3oz8xIsloV7zOmt81G/giphy.gif",
    "https://media.giphy.com/media/l2JhtKtDWYNKdRpoA/giphy.gif",
  ];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    setGifs(trendingGifs);
  }, []);

  return (
    <div className="picker-popup gif-picker" ref={pickerRef}>
      <div className="picker-search">
        <SearchIcon />
        <input
          type="text"
          placeholder="Search GIFs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />
      </div>
      <div className="picker-content gif-content">
        {loading ? (
          <div className="picker-loading">Loading...</div>
        ) : (
          <div className="gif-grid">
            {gifs.map((gif, idx) => (
              <button
                key={idx}
                className="gif-btn"
                onClick={() => onSelect(gif)}
                type="button"
              >
                <img src={gif} alt="GIF" loading="lazy" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Voice Recorder Component
const VoiceRecorder = ({ onClose, onSend, primaryColor }) => {
  const [isRecording, setIsRecording] = useState(true);
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const intervalRef = useRef(null);

  useEffect(() => {
    startRecording();
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      intervalRef.current = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone access denied:", err);
      onClose();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Generate waveform bars
  const waveformBars = useMemo(() => {
    return Array.from({ length: 30 }, () => Math.random() * 100);
  }, [duration]);

  return (
    <div className="voice-recorder">
      <button className="recorder-cancel" onClick={onClose} type="button">
        <CloseIcon />
      </button>

      <div className="waveform">
        {waveformBars.map((height, idx) => (
          <div
            key={idx}
            className="waveform-bar"
            style={{
              height: `${Math.max(10, height * (isRecording ? 1 : 0.3))}%`,
              backgroundColor: primaryColor
            }}
          />
        ))}
      </div>

      <span className="recorder-duration">{formatDuration(duration)}</span>

      <button
        className="recorder-send"
        onClick={isRecording ? stopRecording : () => onSend(audioBlob)}
        style={{ backgroundColor: primaryColor }}
        type="button"
        disabled={!isRecording && !audioBlob}
      >
        {isRecording ? <StopIcon /> : <SendIcon />}
      </button>
    </div>
  );
};

// Format time
const formatTime = (timestamp) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

// Helper to normalize IDs
const normalizeId = (id) => {
  if (!id) return null;
  if (typeof id === "string") return id;
  if (id._id) return id._id.toString?.() || String(id._id);
  if (id.id) return id.id.toString?.() || String(id.id); // Handle .id case
  if (id.toString && typeof id.toString === "function" && id.toString() !== "[object Object]") return id.toString();
  return String(id);
};

// Get other participant from private chat
const getOtherParticipant = (conversation, currentUserId) => {
  if (!conversation || !conversation.participants) return null;

  const currentId = normalizeId(currentUserId);

  // Find participant that is NOT the current user
  const other = conversation.participants.find((p) => {
    const participantId = normalizeId(p.userId?._id || p.userId || p);
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
  const [isUploading, setIsUploading] = useState(false);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const messagesRef = useRef(null);
  const imageInputRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const activeConversationRef = useRef(activeConversation);
  const conversationsRef = useRef(conversations);

  useEffect(() => {
    activeConversationRef.current = activeConversation;
  }, [activeConversation]);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

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

  // Ref for isOpen to access it inside the stable socket handler
  const isOpenRef = useRef(isOpen);
  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  // Join conversation rooms and handle messages
  useEffect(() => {
    if (!isStaff) return;

    // Initialize socket
    const socket = socketClient.getSocket() || socketClient.initSocket();
    socketRef.current = socket;

    // Define handlers
    const handleNewMessage = (data) => {
      console.log("Socket: New Message Received", data);

      // Dispatch content update with current open state
      dispatch(receiveNewMessage({ ...data, isChatOpen: isOpenRef.current }));

      // Check if we have this conversation in our list
      // Use ref to avoid re-binding listener when conversations change
      const conversationExists = conversationsRef.current.some(c => c._id === data.conversationId);

      if (!conversationExists) {
        console.log("New conversation detected, fetching all...");
        dispatch(fetchConversations());
      }

      // Force fetch messages if it's the active conversation to ensure sync
      if (activeConversationRef.current && activeConversationRef.current._id === data.conversationId) {
        dispatch(fetchMessages(data.conversationId));
      }

      // Notification logic
      const myId = normalizeId(user);
      const senderId = normalizeId(data.message.senderId?._id || data.message.senderId);
      const isMyMessage = myId === senderId;

      if (!isOpenRef.current && !isMyMessage) {
        toast.showToast({
          message: `💬 ${data.message.senderName}: ${data.message.content.slice(0, 50)}`,
          type: "success",
        });
      }
    };

    // Attach listeners
    if (socket) {
      socket.on("staffChat:newMessage", handleNewMessage);
      socket.on("staffChat:userTyping", (data) => dispatch(setTyping(data)));

      // Join rooms if we have conversations
      // Note: We might need to rejoin if conversations list changes significantly (e.g. new chat)
      // But usually 'staffUser:{userId}' room handles notifications for new chats.
      if (user && conversations.length > 0) {
        socket.emit("staffChat:join", {
          conversationIds: conversations.map((c) => c._id),
          userId: user._id
        });
      }

      return () => {
        socket.off("staffChat:newMessage", handleNewMessage);
        socket.off("staffChat:userTyping");
      };
    }
  }, [isStaff, user, dispatch, toast]); // Removed conversations from dependency to avoid re-binding

  // Watch for new conversations to join their rooms
  useEffect(() => {
    const socket = socketRef.current;
    if (socket && user && conversations.length > 0) {
      socket.emit("staffChat:join", {
        conversationIds: conversations.map((c) => c._id),
        // userId is already joined, but no harm sending it again or we can omit
      });
    }
  }, [conversations.length, user]); // Only re-run if number of conversations changes

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

  const handleSend = useCallback((contentOverride = null) => {
    const contentToSend = contentOverride || input.trim();
    if (!contentToSend || !activeConversation) return;

    dispatch(sendMessage({ conversationId: activeConversation._id, content: contentToSend }));
    if (!contentOverride) setInput("");

    // Stop typing
    const socket = socketRef.current;
    if (socket && typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      socket.emit("staffChat:typing", { conversationId: activeConversation._id, userId: user._id, userName: user.name, isTyping: false });
    }
  }, [input, activeConversation, dispatch, user]);

  const handleDeleteChat = useCallback(() => {
    if (!activeConversation) return;
    if (window.confirm("Are you sure you want to delete this conversation? This action cannot be undone.")) {
      dispatch(deleteConversation(activeConversation._id));
      handleBack();
    }
  }, [activeConversation, dispatch, handleBack]);

  const onEmojiSelect = (emoji) => {
    setInput(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const onGifSelect = (gifUrl) => {
    handleSend(`![GIF](${gifUrl})`);
    setShowGifPicker(false);
  };

  const onImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        const result = await dispatch(uploadAttachment(file));
        if (uploadAttachment.fulfilled.match(result)) {
          const imageUrl = result.payload;
          handleSend(`![Image](${imageUrl})`);
        } else {
          toast.showToast({ message: "Image upload failed", type: "error" });
        }
      } catch (error) {
        console.error(error);
        toast.showToast({ message: "Image upload error", type: "error" });
      } finally {
        setIsUploading(false);
        e.target.value = "";
      }
    }
  };

  const onVoiceSend = async (blob) => {
    if (blob) {
      setIsUploading(true);
      try {
        // Create a File from Blob
        const file = new File([blob], "voice-message.webm", { type: "audio/webm" });
        const result = await dispatch(uploadAttachment(file));
        if (uploadAttachment.fulfilled.match(result)) {
          const audioUrl = result.payload;
          handleSend(`![Voice](${audioUrl})`);
        } else {
          toast.showToast({ message: "Voice upload failed", type: "error" });
        }
      } catch (error) {
        console.error(error);
        toast.showToast({ message: "Voice upload error", type: "error" });
      } finally {
        setIsUploading(false);
        setShowVoiceRecorder(false);
      }
    }
  };

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

  // Greeting bubble state
  const [showGreeting, setShowGreeting] = useState(true);
  const [hasOpenedBefore, setHasOpenedBefore] = useState(false);

  // Hide greeting when chat opens
  useEffect(() => {
    if (isOpen && !hasOpenedBefore) {
      setShowGreeting(false);
      setHasOpenedBefore(true);
    }
  }, [isOpen, hasOpenedBefore]);

  const onDismissGreeting = (e) => {
    e.stopPropagation();
    setShowGreeting(false);
    setHasOpenedBefore(true);
  };

  if (!isStaff) return null;

  // Filter out self from staff list
  const currentId = normalizeId(user);
  const filteredStaff = staffUsers.filter((s) => normalizeId(s) !== currentId);

  // Get typing users for active conversation
  const typingList = activeConversation ? typingUsers[activeConversation._id] || [] : [];
  const typingText = typingList.map((u) => u.userName).join(", ");

  // De-duplicate conversations - keep only the most recent one per participant pair
  const getUniqueConversations = () => {
    const seen = new Map();
    const myId = normalizeId(user);

    return conversations.filter((conv) => {
      const other = getOtherParticipant(conv, user._id);
      // Get robust other ID
      const otherId = normalizeId(other?.userId?._id || other?.userId || other);

      // If no other participant, or other is me, filter out
      if (!otherId || otherId === myId) return false;

      const key = String(otherId);
      if (seen.has(key)) return false;
      seen.set(key, true);
      return true;
    });
  };
  const uniqueConversations = getUniqueConversations();

  // Get list of staff who are NOT in recent conversations
  const getOtherStaff = () => {
    const conversationUserIds = new Set(
      uniqueConversations.map(c => {
        const other = getOtherParticipant(c, user._id);
        return normalizeId(other?.userId?._id || other?.userId || other);
      })
    );

    return filteredStaff.filter(s => !conversationUserIds.has(normalizeId(s._id)));
  };
  const otherStaff = getOtherStaff();

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
                  {/* Recent Chats Section */}
                  {uniqueConversations.length > 0 && (
                    <div className="staff-chat-section">
                      <div className="staff-chat-section-title">RECENT CHATS</div>
                      {uniqueConversations.map((conv) => {
                        const other = getOtherParticipant(conv, user._id);
                        const hasUnread = conv.unreadCount > 0;
                        const lastMsg = conv.lastMessage;

                        return (
                          <div
                            key={conv._id}
                            className={`staff-chat-item recent-chat-item ${hasUnread ? "unread" : ""}`}
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
                              <div className="staff-chat-item-header">
                                <div className="staff-chat-item-name">{other?.userId?.name || "Unknown"}</div>
                                {lastMsg && (
                                  <div className="staff-chat-item-time">{formatTime(lastMsg.timestamp)}</div>
                                )}
                              </div>
                              <div className="staff-chat-item-preview">
                                {lastMsg?.content ? (
                                  lastMsg.content.startsWith("![") ? (
                                    <span>Attachment 📎</span>
                                  ) : (
                                    lastMsg.content
                                  )
                                ) : (
                                  "No messages yet"
                                )}
                              </div>
                            </div>
                            {hasUnread && (
                              <div className="staff-chat-unread-badge">
                                {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* All Staff Section */}
                  <div className="staff-chat-section">
                    <div className="staff-chat-section-title">ALL STAFF</div>
                    {otherStaff.map((staff) => (
                      <div
                        key={staff._id}
                        className="staff-chat-item"
                        onClick={() => handleSelectStaff(staff)}
                      >
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
              <button
                className="header-close-btn"
                onClick={handleDeleteChat}
                title="Delete Conversation"
                style={{ color: "#ff4757", marginRight: 4 }}
              >
                <TrashIcon />
              </button>
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
                messages.map((msg, index) => {
                  // Robust ID comparison
                  const rawSenderId = msg.senderId?._id || msg.senderId || msg.sender?._id || msg.sender;
                  const msgSenderId = normalizeId(rawSenderId);
                  const myId = normalizeId(user);
                  const isMe = (msgSenderId && myId && msgSenderId === myId);

                  // Check if previous message was from same sender
                  const prevMsg = index > 0 ? messages[index - 1] : null;
                  const prevSenderId = prevMsg ? normalizeId(prevMsg.senderId?._id || prevMsg.senderId || prevMsg.sender?._id || prevMsg.sender) : null;
                  const isFirstInGroup = !prevMsg || prevSenderId !== msgSenderId;
                  const showSenderName = !isMe && isFirstInGroup;

                  return (
                    <div key={msg._id} className={`message ${isMe ? "user-message" : "bot-message"}`} style={{ marginTop: isFirstInGroup ? 16 : 2 }}>
                      <div className="message-content-wrapper">
                        {/* Show sender name for received messages (grouped) */}
                        {showSenderName && (
                          <span style={{ fontSize: 11, color: primaryColor, marginBottom: 2, display: "block", marginLeft: 4 }}>
                            {msg.senderName || "Unknown"}
                          </span>
                        )}
                        <div className="bubble">
                          <MessageParser content={msg.content} />
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
              {/* Pickers */}
              {showEmojiPicker && (
                <EmojiPicker
                  onSelect={onEmojiSelect}
                  onClose={() => setShowEmojiPicker(false)}
                />
              )}

              {showGifPicker && (
                <GifPicker
                  onSelect={onGifSelect}
                  onClose={() => setShowGifPicker(false)}
                />
              )}

              {showVoiceRecorder ? (
                <VoiceRecorder
                  onClose={() => setShowVoiceRecorder(false)}
                  onSend={onVoiceSend}
                  primaryColor={primaryColor}
                />
              ) : (
                <div className="inpu  t-container">
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
                    <div className="input-icons">
                      <input
                        type="file"
                        ref={imageInputRef}
                        accept="image/*"
                        onChange={onImageSelect}
                        style={{ display: "none" }}
                      />
                      <button
                        className="input-icon-btn"
                        title="Send image"
                        onClick={() => imageInputRef.current?.click()}
                        disabled={isUploading}
                      >
                        <ImageIcon />
                      </button>
                      <button
                        className={`input-icon-btn ${showEmojiPicker ? "active" : ""}`}
                        title="Add emoji"
                        onClick={() => {
                          setShowEmojiPicker(!showEmojiPicker);
                          setShowGifPicker(false);
                        }}
                        style={showEmojiPicker ? { color: primaryColor } : {}}
                        disabled={isUploading}
                      >
                        <EmojiIcon />
                      </button>
                      <button
                        className={`input-icon-btn ${showGifPicker ? "active" : ""}`}
                        title="Add GIF"
                        onClick={() => {
                          setShowGifPicker(!showGifPicker);
                          setShowEmojiPicker(false);
                        }}
                        style={showGifPicker ? { color: primaryColor } : {}}
                        disabled={isUploading}
                      >
                        <GifIcon />
                      </button>
                      <button
                        className="input-icon-btn"
                        title="Voice message"
                        onClick={() => setShowVoiceRecorder(true)}
                        disabled={isUploading}
                      >
                        <MicIcon />
                      </button>
                    </div>

                    <button
                      className="send-btn"
                      onClick={() => handleSend()}
                      disabled={!input.trim() || isUploading}
                      style={{ backgroundColor: primaryColor }}
                    >
                      {isUploading ? <div className="spinner-border spinner-border-sm" /> : <SendIcon />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Greeting Bubble */}
      {showGreeting && !isOpen && !hasOpenedBefore && (
        <div className="greeting-bubble" style={{ position: "absolute", bottom: "80px", right: 0, zIndex: 10000 }}>
          <button className="greeting-close" onClick={onDismissGreeting} type="button">
            <CloseIcon />
          </button>
          <div className="greeting-content">
            <span className="greeting-wave">👋</span>
            <strong>Hi {user?.name?.split(" ")[0] || "Team"}!</strong>
          </div>
          <p>
            {totalUnread > 0
              ? `You have ${totalUnread} unread messages from your team.`
              : "Connect with your colleagues here."}
          </p>
        </div>
      )}

      {/* Floating Buttons Container */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Scroll to Top Button */}
        <ScrollToTopButton className="scroll-to-top" />

        {/* Toggle Button */}
        <button
          className="staff-chat-toggle"
          onClick={() => setIsOpen(!isOpen)}
          style={{ backgroundColor: primaryColor }}
        >
          <div className="toggle-icon users-icon">
            <UsersIcon />
          </div>
          <div className="toggle-icon close-icon">
            <CloseIcon />
          </div>
          {totalUnread > 0 && !isOpen && (
            <span className="staff-chat-badge">{totalUnread > 99 ? "99+" : totalUnread}</span>
          )}
        </button>
      </div>
    </div>
  );
}
