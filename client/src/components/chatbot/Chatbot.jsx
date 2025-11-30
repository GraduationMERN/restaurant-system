import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  toggleChatbot,
  addLocalMessage,
  clearSuggestions,
  clearRelevantItems,
  checkChatbotHealth,
  sendChatMessage,
} from "../../redux/slices/chatbotSlice";
import "./Chatbot.css";

export default function Chatbot() {
    const dispatch = useDispatch();
    const {
        isActive,
        isWaiting,
        messages,
        suggestions,
        relevantItems,
    } = useSelector((s) => s.chatbot);
    const [input, setInput] = useState("");
    const messagesRef = useRef(null);

    const timeString = () => {
        const now = new Date();
        return `${now.getHours().toString().padStart(2, "0")}:${now
            .getMinutes()
            .toString()
            .padStart(2, "0")}`;
    };

    useEffect(() => {
        const t = setTimeout(() => {
            dispatch(checkChatbotHealth());
        }, 1000);
        return () => clearTimeout(t);
    }, [dispatch]);

    useEffect(() => {
        if (messagesRef.current) {
            messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
        }
    }, [messages, relevantItems, suggestions]);

    const onToggle = () => {
        dispatch(toggleChatbot());
    };

    const onSubmit = (e) => {
        e.preventDefault();
        const message = input.trim();
        if (!message || isWaiting) return;

        dispatch(
            addLocalMessage({ type: "user", content: message, time: new Date().toISOString() })
        );

        setInput("");
        dispatch(clearSuggestions());
        dispatch(clearRelevantItems());
        dispatch(sendChatMessage(message));
    };

    const onSuggestionClick = (query) => {
        setInput(query);
        // trigger submit programmatically
        const fakeEvent = { preventDefault: () => { } };
        onSubmit(fakeEvent);
    };

    const typingIndicator = useMemo(() => {
        if (!isWaiting) return null;
        return (
            <div className="message bot-message typing-indicator">
                <div className="message-content">
                    <div className="typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            </div>
        );
    }, [isWaiting]);

    return (
        <div className={`chatbot-container ${isActive ? "active" : ""}`} id="chatbot">
            <button className="chatbot-toggle" aria-label="Toggle chatbot" aria-expanded={isActive} onClick={onToggle}>
                <span className="chat-icon" aria-hidden="true">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                </span>
                <span className="close-icon" aria-hidden="true">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </span>
            </button>

            <div className="chatbot-window">
                <div className="chatbot-header">
                    <h3>🍽️ Restaurant Assistant</h3>
                    <p>Powered by AI • Ask me anything!</p>
                </div>

                <div className="chatbot-messages" id="chatMessages" ref={messagesRef}>
                    {messages.map((m, idx) => (
                        <div key={idx} className={`message ${m.type}-message`}>
                            <div className="message-content">
                                <p>{m.content}</p>
                            </div>
                            <span className="message-time">{timeString()}</span>
                        </div>
                    ))}

                    {relevantItems && relevantItems.length > 0 && (
                        <div className="relevant-items">
                            <div className="relevant-items-title">📋 Based on your question:</div>
                            {relevantItems.map((item, i) => (
                                <div key={i} className="item-card">
                                    <span className="item-name">{item.name}</span>
                                    <span className="item-price">${item.price}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {typingIndicator}

                    {suggestions && suggestions.length > 0 && (
                        <div className="suggestion-buttons">
                            {suggestions.map((s, i) => (
                                <button
                                    type="button"
                                    className="suggestion-btn"
                                    data-query={s.query}
                                    key={i}
                                    onClick={() => onSuggestionClick(s.query)}
                                >
                                    {s.text}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <form className="chatbot-input" id="chatForm" onSubmit={onSubmit}>
                    <input
                        type="text"
                        id="userMessage"
                        placeholder="Ask about our menu..."
                        aria-label="Type your message"
                        required
                        autoComplete="off"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                    />
                    <button type="submit" aria-label="Send message">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13"></line>
                            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                        </svg>
                    </button>
                </form>
            </div>
        </div>
    );
}

