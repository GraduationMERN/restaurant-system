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

// Helper to parse message content with basic Markdown support
const MessageParser = ({ content, type }) => {
    if (type === "user") {
        return <div className="bubble text-bubble">{content}</div>;
    }

    // 1. Tokenize content into blocks (Text, List, Table, Image)
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

        // Check for Image URL
        const imgRegex = /(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp))/i;
        const imgMatch = line.match(imgRegex);

        if (imgMatch) {
            flushBlock();
            const url = imgMatch[0];
            const textPart = line.replace(url, "").trim();
            if (textPart) {
                blocks.push({ type: "text", content: textPart });
            }
            blocks.push({ type: "image", url: url });
            return;
        }

        // Check for List Item (- or *)
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
            if (!currentBlock || currentBlock.type !== "list") {
                flushBlock();
                currentBlock = { type: "list", items: [] };
            }
            currentBlock.items.push(trimmed.substring(2));
            return;
        }

        // Check for Table Row (| ... |)
        if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
            if (!currentBlock || currentBlock.type !== "table") {
                flushBlock();
                currentBlock = { type: "table", rows: [] };
            }
            // Parse row cells
            const cells = trimmed.split("|").filter((c, i, arr) => i > 0 && i < arr.length - 1).map(c => c.trim());
            currentBlock.rows.push(cells);
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

    // Helper to render inline formatting (Bold)
    const renderInline = (text) => {
        // Replace **text** with <strong>text</strong>
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
                    return <p key={idx} className="content-text">{renderInline(block.content)}</p>;
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
                if (block.type === "table") {
                    return (
                        <div key={idx} className="content-table-wrapper">
                            <table className="content-table">
                                <tbody>
                                    {block.rows.map((row, rIdx) => (
                                        <tr key={rIdx}>
                                            {row.map((cell, cIdx) => (
                                                <td key={cIdx}>{renderInline(cell)}</td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    );
                }
                if (block.type === "image") {
                    return (
                        <div key={idx} className="content-image-wrapper">
                            <img
                                src={block.url}
                                alt="Content"
                                className="content-image"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    window.dispatchEvent(new CustomEvent('preview-image', { detail: block.url }));
                                }}
                            />
                        </div>
                    );
                }
                return null;
            })}
        </div>
    );
};

// Heuristic function to auto-format plain text responses
const preprocessContent = (content) => {
    if (!content) return "";
    
    // If content already has markdown, leave it alone (simple check)
    if (content.includes("**") || content.includes("|") || content.includes("- ")) return content;

    let formatted = content;

    // 1. Format "The [Item] is [Desc], priced at [Price]" -> "- **[Item]**: [Desc] (**[Price]**)"
    formatted = formatted.replace(
        /The (.*?) is (.*?), priced at (\$\d+)/gi, 
        "\n- **$1**: $2 (**$3**)"
    );

    // 2. Format "recommend the [Item] for [Price]"
    formatted = formatted.replace(
        /recommend the (.*?) for (\$\d+(?:\.\d+)?)/gi, 
        "\n- **$1**: $2"
    );

    // 3. Format "or the [Item] for [Price]" (often follows recommendation)
    formatted = formatted.replace(
        /or the (.*?) for (\$\d+(?:\.\d+)?)/gi, 
        "\n- **$1**: $2"
    );

    // 4. Format "the [Item] is also a great option for [Price]"
    formatted = formatted.replace(
        /the (.*?) is also a great option for (\$\d+(?:\.\d+)?)/gi, 
        "\n- **$1**: $2"
    );

    // 5. Format simple "Item Name: $Price" lines if they exist
    formatted = formatted.replace(/^([A-Za-z ]+): (\$\d+)/gm, "- **$1**: $2");

    // Clean up double newlines that might result from replacements
    formatted = formatted.replace(/\n\n/g, "\n");

    return formatted;
};

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
    const [previewImage, setPreviewImage] = useState(null);
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
    }, [messages, relevantItems, suggestions, isWaiting]);

    // Listen for custom preview events from the parser
    useEffect(() => {
        const handlePreview = (e) => setPreviewImage(e.detail);
        window.addEventListener('preview-image', handlePreview);
        return () => window.removeEventListener('preview-image', handlePreview);
    }, []);

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
        dispatch(
            addLocalMessage({ type: "user", content: query, time: new Date().toISOString() })
        );
        dispatch(clearSuggestions());
        dispatch(clearRelevantItems());
        dispatch(sendChatMessage(query));
        setInput("");
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

    return (
        <div className={`chatbot-container ${isActive ? "active" : ""}`} id="chatbot">
            <div className="chatbot-window">
                <div className="chatbot-header">
                    <div className="bot-avatar">
                        <img 
                          src="/images/bot-logo.png" 
                          alt="Bot"
                          onError={(e) => e.target.style.display = 'none'}
                        />
                    </div>
                    <div className="header-info">
                        <h3>Bella Assistant</h3>
                        <p><span className="status-dot"></span> Online</p>
                    </div>
                    <button className="header-close-btn" onClick={onToggle}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <div className="chatbot-messages" id="chatMessages" ref={messagesRef}>
                    {messages.map((m, idx) => (
                        <div key={idx} className={`message ${m.type}-message`}>
                            <div className="message-content-wrapper">
                                <MessageParser 
                                    content={m.type === 'bot' ? preprocessContent(m.content) : m.content} 
                                    type={m.type} 
                                />
                                <span className="message-time">{timeString()}</span>
                            </div>
                        </div>
                    ))}

                    {relevantItems && relevantItems.length > 0 && (
                        <div className="relevant-items">
                            {relevantItems.map((item, i) => (
                                <div key={i} className="product-card" onClick={() => item.img && setPreviewImage(item.img)}>
                                    <img 
                                        src={item.img || "/images/restaurant-interior.jpg"} 
                                        alt={item.name} 
                                        className="product-image"
                                        onError={(e) => e.target.src = "/images/restaurant-interior.jpg"}
                                    />
                                    <div className="product-info">
                                        <div className="product-name" title={item.name}>{item.name}</div>
                                        <div className="product-price">${item.price}</div>
                                    </div>
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
                                    key={i}
                                    onClick={() => onSuggestionClick(s.query)}
                                >
                                    {s.text}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="chatbot-input-area">
                    <form className="input-wrapper" onSubmit={onSubmit}>
                        <input
                            type="text"
                            placeholder="Ask about our menu..."
                            aria-label="Type your message"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={isWaiting}
                        />
                        <button type="submit" className="send-btn" aria-label="Send message" disabled={!input.trim() || isWaiting}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="22" y1="2" x2="11" y2="13"></line>
                                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                            </svg>
                        </button>
                    </form>
                </div>
            </div>

            <button className="chatbot-toggle" aria-label="Toggle chatbot" aria-expanded={isActive} onClick={onToggle}>
                <span className="toggle-icon chat-icon" aria-hidden="true">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                </span>
                <span className="toggle-icon close-icon" aria-hidden="true">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </span>
            </button>

            {previewImage && (
                <div className="image-preview-overlay" onClick={() => setPreviewImage(null)}>
                    <div className="preview-content" onClick={e => e.stopPropagation()}>
                        <button className="close-preview" onClick={() => setPreviewImage(null)}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                        <img src={previewImage} alt="Preview" className="preview-image" />
                    </div>
                </div>
            )}
        </div>
    );
}

