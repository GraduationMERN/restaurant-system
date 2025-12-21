import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  toggleChatbot,
  addLocalMessage,
  clearSuggestions,
  checkChatbotHealth,
  sendChatMessage,
  resetChatSession,
  clearChat,
  loadChatHistory,
  setWelcomeMessage,
} from "../../redux/slices/chatbotSlice";
import { useSettings } from "../../context/SettingContext";
import ScrollToTopButton from "../common/ScrollToTopButton";
import "./Chatbot.css";

// Common Emojis data
const EMOJI_CATEGORIES = {
  "Frequently Used": ["👍", "👎", "😢", "🙂", "😐", "😊", "🤩"],
  "Smileys & Emotion": ["😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "😊", "😇", "🥰", "😍", "🤩", "😘", "😗", "😚", "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🤫", "🤔", "🤐", "🤨", "😐", "😑", "😶", "😏", "😒", "🙄", "😬", "😮‍💨", "🤥"],
  "Gestures": ["👋", "🤚", "🖐️", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "👇", "☝️", "👍", "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", "🤝", "🙏"],
  "Food & Drink": ["🍏", "🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐", "🍈", "🍒", "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🍆", "🥑", "🥦", "🥬", "🥒", "🌶️", "🫑", "🌽", "🥕", "🧄", "🧅", "🥔", "🍔", "🍟", "🍕", "🌭", "🥪", "🌮", "🌯", "🫔", "🥙", "🧆"],
};

// Helper to parse message content with Markdown support
const MessageParser = ({ content, type }) => {
  if (type === "user") {
    return <div className="bubble text-bubble">{content}</div>;
  }

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
      if (textBefore) {
        blocks.push({ type: "text", content: textBefore });
      }
      blocks.push({ type: "image", url: mdImgMatch[2], alt: mdImgMatch[1] });
      if (textAfter) {
        blocks.push({ type: "text", content: textAfter });
      }
      return;
    }

    // Check for List Item
    if (trimmed.match(/^[-*]\s/) || trimmed.match(/^\d+\.\s/)) {
      if (!currentBlock || currentBlock.type !== "list") {
        flushBlock();
        currentBlock = { type: "list", items: [] };
      }
      currentBlock.items.push(trimmed.replace(/^[-*\d.]+\s*/, ""));
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
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="bubble bot-content-card">
      {blocks.map((block, idx) => {
        if (block.type === "text") {
          return (
            <p key={idx} className="content-text">
              {renderInline(block.content)}
            </p>
          );
        }
        if (block.type === "list") {
          return (
            <ul key={idx} className="content-list">
              {block.items.map((item, i) => (
                <li key={i}>{renderInline(item)}</li>
              ))}
            </ul>
          );
        }
        if (block.type === "image") {
          return (
            <div key={idx} className="content-image-wrapper">
              <img
                src={block.url}
                alt={block.alt || "Content"}
                className="content-image"
              />
            </div>
          );
        }
        return null;
      })}
    </div>
  );
};

// Icons as components
const ExpandIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 3h6v6" />
    <path d="M9 21H3v-6" />
    <path d="M21 3l-7 7" />
    <path d="M3 21l7-7" />
  </svg>
);

const CollapseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 14h6v6" />
    <path d="M20 10h-6V4" />
    <path d="M14 10l7-7" />
    <path d="M3 21l7-7" />
  </svg>
);

const DownloadIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" x2="12" y1="15" y2="3" />
  </svg>
);

const ImageIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
    <circle cx="9" cy="9" r="2"/>
    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
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

const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 19V5" />
    <path d="m5 12 7-7 7 7" />
  </svg>
);

const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m15 18-6-6 6-6" />
  </svg>
);

const MenuIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="6" r="1.5" />
    <circle cx="12" cy="12" r="1.5" />
    <circle cx="12" cy="18" r="1.5" />
  </svg>
);

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const ChatIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

// Format relative time
const formatRelativeTime = (timestamp) => {
  if (!timestamp) return "";
  const now = new Date();
  const time = new Date(timestamp);
  const diff = Math.floor((now - time) / 1000);
  
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return time.toLocaleDateString();
};

// Emoji Picker Component
const EmojiPicker = ({ onSelect, onClose, primaryColor }) => {
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

// GIF Picker Component (simplified - uses Giphy-like UI)
const GifPicker = ({ onSelect, onClose, primaryColor }) => {
  const [search, setSearch] = useState("");
  const [gifs, setGifs] = useState([]);
  const [loading, setLoading] = useState(false);
  const pickerRef = useRef(null);

  // Sample trending GIFs (in production, use Giphy/Tenor API)
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
        onClick={isRecording ? stopRecording : () => onSend(audioUrl)}
        style={{ backgroundColor: primaryColor }}
        type="button"
      >
        {isRecording ? <StopIcon /> : <SendIcon />}
      </button>
    </div>
  );
};

export default function Chatbot() {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { settings } = useSettings();
  const { isActive, isWaiting, messages, suggestions, conversationState, isLoaded } =
    useSelector((s) => s.chatbot);
  const { isAuthenticated, user } = useSelector((s) => s.auth);
  
  const [input, setInput] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [prevAuth, setPrevAuth] = useState(isAuthenticated);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showGreeting, setShowGreeting] = useState(true);
  const [hasOpenedBefore, setHasOpenedBefore] = useState(false);
  const messagesRef = useRef(null);
  const imageInputRef = useRef(null);

  // Restaurant info from settings
  const restaurantName = settings?.restaurantName || "Assistant";
  const logoUrl = settings?.branding?.logoUrl || "/images/bot-logo.png";
  const primaryColor = settings?.branding?.primaryColor || "#e85c41";
  const agentName = restaurantName;

  // Apply dynamic primary color
  useEffect(() => {
    if (primaryColor) {
      document.documentElement.style.setProperty("--cb-primary", primaryColor);
      // Calculate darker shade
      const darkerColor = adjustColor(primaryColor, -20);
      document.documentElement.style.setProperty("--cb-primary-dark", darkerColor);
    }
  }, [primaryColor]);

  // Helper to darken/lighten color
  const adjustColor = (color, percent) => {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, Math.min(255, (num >> 16) + amt));
    const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amt));
    const B = Math.max(0, Math.min(255, (num & 0x0000FF) + amt));
    return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
  };

  // Initial load - check health
  useEffect(() => {
    dispatch(checkChatbotHealth());
  }, [dispatch]);

  // Load chat history when chatbot opens or auth changes
  useEffect(() => {
    if (isActive && !isLoaded) {
      dispatch(loadChatHistory()).then((result) => {
        if (!result.payload?.messages?.length) {
          // Send "start" to backend to get welcome message with menu image
          dispatch(sendChatMessage("start"));
        }
      });
    }
  }, [isActive, isLoaded, dispatch]);

  // Handle logout - clear chat when user logs out
  useEffect(() => {
    if (prevAuth && !isAuthenticated) {
      dispatch(clearChat());
    }
    setPrevAuth(isAuthenticated);
  }, [isAuthenticated, prevAuth, dispatch]);

  // Handle login - reload chat history when user logs in
  useEffect(() => {
    if (!prevAuth && isAuthenticated && isActive) {
      dispatch(loadChatHistory()).then((result) => {
        if (!result.payload?.messages?.length) {
          // Send "start" to backend to get welcome message with menu image
          dispatch(sendChatMessage("start"));
        }
      });
    }
  }, [isAuthenticated, prevAuth, isActive, dispatch]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages, suggestions, isWaiting]);

  // Hide greeting when chat opens
  useEffect(() => {
    if (isActive && !hasOpenedBefore) {
      setShowGreeting(false);
      setHasOpenedBefore(true);
    }
  }, [isActive, hasOpenedBefore]);

  const onToggle = () => {
    dispatch(toggleChatbot());
    setShowMenu(false);
    setIsExpanded(false);
    setShowEmojiPicker(false);
    setShowGifPicker(false);
    setShowVoiceRecorder(false);
  };

  const onDismissGreeting = () => {
    setShowGreeting(false);
    setHasOpenedBefore(true);
  };

  const onSubmit = (e) => {
    e.preventDefault();
    const message = input.trim();
    if (!message || isWaiting) return;

    dispatch(
      addLocalMessage({
        type: "user",
        content: message,
        time: new Date().toISOString(),
      })
    );

    setInput("");
    dispatch(clearSuggestions());
    dispatch(sendChatMessage(message));
  };

  const onSuggestionClick = (query) => {
    dispatch(
      addLocalMessage({
        type: "user",
        content: query,
        time: new Date().toISOString(),
      })
    );
    dispatch(clearSuggestions());
    dispatch(sendChatMessage(query));
  };

  const onResetChat = () => {
    dispatch(resetChatSession());
    setShowMenu(false);
  };

  const onToggleExpand = () => {
    setIsExpanded(!isExpanded);
    setShowMenu(false);
  };

  const onDownloadTranscript = () => {
    const transcript = messages.map(m => {
      const sender = m.type === "user" ? "You" : agentName;
      const time = formatRelativeTime(m.time);
      return `[${sender}] ${time}\n${m.content}\n`;
    }).join("\n");

    const blob = new Blob([transcript], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-transcript-${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowMenu(false);
  };

  const onEmojiSelect = (emoji) => {
    setInput(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const onGifSelect = (gifUrl) => {
    // Send GIF as a message
    dispatch(
      addLocalMessage({
        type: "user",
        content: `![GIF](${gifUrl})`,
        time: new Date().toISOString(),
      })
    );
    dispatch(sendChatMessage(`[User sent a GIF]`));
    setShowGifPicker(false);
  };

  const onImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // For demo, create a local URL. In production, upload to server
      const imageUrl = URL.createObjectURL(file);
      dispatch(
        addLocalMessage({
          type: "user",
          content: `![Image](${imageUrl})`,
          time: new Date().toISOString(),
        })
      );
      dispatch(sendChatMessage(`[User sent an image: ${file.name}]`));
    }
    e.target.value = "";
  };

  const onVoiceSend = (audioUrl) => {
    if (audioUrl) {
      dispatch(
        addLocalMessage({
          type: "user",
          content: "🎤 Voice message sent",
          time: new Date().toISOString(),
        })
      );
      dispatch(sendChatMessage("[User sent a voice message]"));
    }
    setShowVoiceRecorder(false);
  };

  const typingIndicator = useMemo(() => {
    if (!isWaiting) return null;
    return (
      <div className="message bot-message">
        <div className="typing-indicator">
          <span className="dot"></span>
          <span className="dot"></span>
          <span className="dot"></span>
        </div>
      </div>
    );
  }, [isWaiting]);

  // In LTR: add some margin from right edge. In RTL: no extra margin needed
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const marginClass = isRTL ? "" : "lg:mr-10";

  return (
    <div
      className={`chatbot-container ${marginClass} ${isActive ? "active" : ""} ${isExpanded ? "expanded" : ""}`}
      id="chatbot"
      style={{ "--cb-primary": primaryColor }}
    >
      <div className="chatbot-window">
        {/* Header */}
        <div className="chatbot-header">
          <button className="header-back-btn" onClick={onToggle} title="Back">
            <BackIcon />
          </button>
          
          <div className="bot-avatar">
            <img
              src={logoUrl}
              alt={agentName}
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          </div>
          
          <div className="header-info">
            <h3>{agentName}</h3>
            <p>{t("chatbot_active")}</p>
          </div>
          
          {/* Menu Button */}
          <div className="header-menu">
            <button
              className="menu-btn"
              onClick={() => setShowMenu(!showMenu)}
              title="Options"
            >
              <MenuIcon />
            </button>
            {showMenu && (
              <div className="menu-dropdown">
                <button onClick={onToggleExpand}>
                  {isExpanded ? <CollapseIcon /> : <ExpandIcon />}
                  <span>{isExpanded ? t("chatbot_collapse") : t("chatbot_expand")}</span>
                </button>
                <button onClick={onDownloadTranscript}>
                  <DownloadIcon />
                  <span>{t("chatbot_download")}</span>
                </button>
                <button onClick={onResetChat}>
                  <span style={{ fontSize: "18px" }}>🔄</span>
                  <span>{t("chatbot_new_conversation")}</span>
                </button>
              </div>
            )}
          </div>

          <button className="header-close-btn" onClick={onToggle} title="Close">
            <CloseIcon />
          </button>
        </div>

        {/* Messages */}
        <div className="chatbot-messages" id="chatMessages" ref={messagesRef}>
          {messages.map((m, idx) => (
            <div key={idx} className={`message ${m.type}-message`}>
              <div className="message-content-wrapper">
                <MessageParser content={m.content} type={m.type} />
                {m.type === "bot" ? (
                  <div className="message-meta">
                    <span className="message-agent-name">{agentName}</span>
                    <span className="message-time">• {formatRelativeTime(m.time)}</span>
                  </div>
                ) : (
                  <span className="message-time">{formatRelativeTime(m.time)}</span>
                )}
              </div>
            </div>
          ))}

          {typingIndicator}

          {suggestions && suggestions.length > 0 && (
            <div className="suggestion-buttons">
              {suggestions.map((s, i) => (
                <button
                  type="button"
                  className="suggestion-btn"
                  key={i}
                  onClick={() => onSuggestionClick(s.query)}
                  style={{ backgroundColor: primaryColor }}
                >
                  {s.text}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="chatbot-input-area">
          {/* Emoji Picker */}
          {showEmojiPicker && (
            <EmojiPicker
              onSelect={onEmojiSelect}
              onClose={() => setShowEmojiPicker(false)}
              primaryColor={primaryColor}
            />
          )}

          {/* GIF Picker */}
          {showGifPicker && (
            <GifPicker
              onSelect={onGifSelect}
              onClose={() => setShowGifPicker(false)}
              primaryColor={primaryColor}
            />
          )}

          {/* Voice Recorder */}
          {showVoiceRecorder ? (
            <VoiceRecorder
              onClose={() => setShowVoiceRecorder(false)}
              onSend={onVoiceSend}
              primaryColor={primaryColor}
            />
          ) : (
            <div className="input-container">
              <form className="input-wrapper" onSubmit={onSubmit}>
                <input
                  type="text"
                  placeholder={t("chatbot_placeholder")}
                  aria-label="Type your message"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isWaiting}
                  dir="auto"
                />
              </form>
              
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
                    type="button" 
                    className="input-icon-btn" 
                    title={t("send_image")}
                    onClick={() => imageInputRef.current?.click()}
                  >
                    <ImageIcon />
                  </button>
                  <button 
                    type="button" 
                    className={`input-icon-btn ${showEmojiPicker ? "active" : ""}`}
                    title={t("add_emoji")}
                    onClick={() => {
                      setShowEmojiPicker(!showEmojiPicker);
                      setShowGifPicker(false);
                    }}
                    style={showEmojiPicker ? { color: primaryColor } : {}}
                  >
                    <EmojiIcon />
                  </button>
                  <button 
                    type="button" 
                    className={`input-icon-btn ${showGifPicker ? "active" : ""}`}
                    title={t("add_gif")}
                    onClick={() => {
                      setShowGifPicker(!showGifPicker);
                      setShowEmojiPicker(false);
                    }}
                    style={showGifPicker ? { color: primaryColor } : {}}
                  >
                    <GifIcon />
                  </button>
                  <button 
                    type="button" 
                    className="input-icon-btn" 
                    title={t("voice_message")}
                    onClick={() => setShowVoiceRecorder(true)}
                  >
                    <MicIcon />
                  </button>
                </div>
                
                <button
                  type="submit"
                  className="send-btn"
                  aria-label="Send message"
                  disabled={!input.trim() || isWaiting}
                  onClick={onSubmit}
                  style={{ backgroundColor: primaryColor }}
                >
                  <SendIcon />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Greeting Bubble - Shows before first open */}
      {showGreeting && !isActive && !hasOpenedBefore && (
        <div className="greeting-bubble">
          <button className="greeting-close" onClick={onDismissGreeting} type="button">
            <CloseIcon />
          </button>
          <div className="greeting-content">
            <span className="greeting-wave">👋</span>
            <strong>{t("chatbot_greeting_hi")} {agentName}!</strong>
          </div>
          <p>{t("chatbot_greeting_help")}</p>
        </div>
      )}

      {/* Floating Buttons Container */}
      <div className="chatbot-buttons-container">
        {/* Scroll to Top Button */}
        <ScrollToTopButton className="scroll-to-top-btn"/>
        
        {/* Toggle Button */}
        <button
          className="chatbot-toggle"
          aria-label="Toggle chatbot"
          aria-expanded={isActive}
          onClick={onToggle}
          style={{ backgroundColor: primaryColor }}
        >
          <span className="toggle-icon chat-icon" aria-hidden="true">
            <ChatIcon />
          </span>
          <span className="toggle-icon close-icon" aria-hidden="true">
            <CloseIcon />
          </span>
        </button>
      </div>
    </div>
  );
}

