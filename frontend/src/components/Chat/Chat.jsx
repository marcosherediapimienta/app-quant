import { useState, useEffect, useRef } from 'react';
import { chatService } from '../../services/chatService';
import Card from '../Card/Card';
import Button from '../Button/Button';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import './Chat.css';

const SUGGESTED_QUESTIONS = [
  { label: '📊 Sharpe Ratio', text: 'How is the Sharpe ratio calculated?' },
  { label: '📉 VaR & ES', text: 'What is the difference between VaR and Expected Shortfall?' },
  { label: '📉 Max Drawdown', text: 'What is Maximum Drawdown and how is it interpreted?' },
  { label: '📈 Beta CAPM', text: 'How do I interpret a beta of 1.5 in CAPM?' },
  { label: '🏦 Treynor Ratio', text: 'What is the Treynor ratio and how does it differ from Sharpe?' },
  { label: '🎯 Alpha Significance', text: 'How does the alpha significance test work?' },
  { label: '🔀 Efficient Frontier', text: 'How does the Markowitz efficient frontier work?' },
  { label: '⚖️ Risk Parity', text: 'How does Risk Parity optimization work?' },
  { label: '🧠 Black-Litterman', text: 'What is the Black-Litterman model?' },
  { label: '💰 Valuation Score', text: 'How does the valuation scoring system work?' },
  { label: '🌍 Macro Factors', text: 'What macro factors does the app analyze?' },
  { label: '📉 Yield Curve', text: 'How is the yield curve analyzed in this app?' },
];

const convertLatexFormat = (text) => {
  if (!text) return text;
  let converted = text.replace(/\\\[([\s\S]*?)\\\]/g, '\n$$\n$1\n$$\n');
  converted = converted.replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$');
  return converted;
};

const getSessionId = () => {
  let sid = sessionStorage.getItem('warren_session_id');
  if (!sid) {
    sid = `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    sessionStorage.setItem('warren_session_id', sid);
  }
  return sid;
};

const SESSION_ID = getSessionId();

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    loadWelcomeMessage();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadWelcomeMessage = async () => {
    try {
      const data = await chatService.getWelcome();
      setMessages([{
        role: 'assistant',
        content: data.message,
        timestamp: new Date().toISOString()
      }]);
    } catch (err) {
      if (import.meta.env.DEV) console.error('Error loading welcome message:', err);
      setError('Could not load the chatbot. Is the server running?');
    }
  };

  const sendMessage = async (text) => {
    const userMessage = text.trim();
    if (!userMessage || isLoading) return;

    setInputMessage('');
    setError(null);
    setShowSuggestions(false); 
    setMessages(prev => [...prev, {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    }]);
    setIsLoading(true);

    try {
      const data = await chatService.sendMessage(userMessage, SESSION_ID);

      if (!data || !data.response) {
        throw new Error('Invalid server response');
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response,
        sources: data.sources || [],
        hasRag: data.has_rag || false,
        timestamp: new Date().toISOString()
      }]);
    } catch (err) {
      if (import.meta.env.DEV) console.error('Error sending message:', err);

      const errorMsg = err?.response?.data?.error || err?.message || 'Unknown error';
      setError(`Error sending message: ${errorMsg}`);

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '❌ Sorry, there was an error processing your message. Please try again.',
        isError: true,
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    sendMessage(inputMessage);
  };

  const handleSuggestionClick = (text) => {
    sendMessage(text);
  };

  const handleClearChat = async () => {
    if (!window.confirm('Are you sure you want to clear the chat?')) return;

    try {
      await chatService.clearMemory(SESSION_ID);
      setMessages([]);
      setShowSuggestions(true);
      await loadWelcomeMessage();
    } catch (err) {
      if (import.meta.env.DEV) console.error('Error clearing chat:', err);
      setError('Error clearing chat');
    }
  };

  const handleKeyDown = (e) => {

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputMessage);
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = (message, index) => {
    const isUser = message.role === 'user';
    const isError = message.isError;

    return (
      <div key={index} className={`chat-message ${isUser ? 'user' : 'assistant'} ${isError ? 'error' : ''}`}>
        <div className="message-header">
          <span className="message-role">
            {isUser ? '👤 You' : '🤖 GalaAI'}
          </span>
          <span className="message-timestamp">
            {formatTimestamp(message.timestamp)}
          </span>
        </div>
        <div className="message-content">
          <ReactMarkdown
            remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeKatex]}
          >
            {convertLatexFormat(message.content)}
          </ReactMarkdown>
        </div>
        {message.sources && message.sources.length > 0 && (
          <div className="message-sources">
            <div className="sources-title">📚 Referenced code:</div>
            {message.sources.slice(0, 4).map((source, idx) => (
              <div key={idx} className="source-item">
                <span className="source-type">{source.type}</span>
                <span className="source-name">{source.name}</span>
                <span className="source-file">({source.file})</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const hasConversation = messages.length > 1;

  return (
    <div className="chat-container">
      <Card className="chat-card">
        {/* Header */}
        <div className="chat-header">
          <div className="chat-title">
            <h2>🤖 GalaAI</h2>
            <p className="chat-subtitle">
              Quantitative Analysis Assistant — Gala Analytics
            </p>
          </div>
          <Button
            onClick={handleClearChat}
            variant="secondary"
            disabled={!hasConversation}
            title="Clear conversation"
          >
            🗑️ Clear
          </Button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="chat-error" role="alert">
            ⚠️ {error}
            <button className="chat-error-close" onClick={() => setError(null)}>✕</button>
          </div>
        )}

        {/* Messages area */}
        <div className="chat-messages" role="log" aria-live="polite">
          {messages.map((msg, idx) => renderMessage(msg, idx))}

          {/* Typing indicator */}
          {isLoading && (
            <div className="chat-message assistant loading">
              <div className="message-header">
                <span className="message-role">🤖 GalaAI</span>
              </div>
              <div className="message-content">
                <div className="typing-indicator" aria-label="GalaAI is typing...">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested questions (visible at start or after clearing) */}
        {showSuggestions && !isLoading && (
          <div className="chat-suggestions">
            <p className="suggestions-label">💡 Frequently asked:</p>
            <div className="suggestions-grid">
              {SUGGESTED_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  className="suggestion-chip"
                  onClick={() => handleSuggestionClick(q.text)}
                  disabled={isLoading}
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message input */}
        <form onSubmit={handleFormSubmit} className="chat-input-form">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your question... (e.g. How is the Sharpe ratio calculated?)"
            className="chat-input"
            disabled={isLoading}
            maxLength={1000}
            aria-label="Message to chatbot"
            autoComplete="off"
          />
          <Button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            variant="primary"
            title="Send message (Enter)"
          >
            {isLoading ? '⏳' : '📤'}
          </Button>
        </form>

        {/* Footer with character counter and tip */}
        <div className="chat-footer">
          {inputMessage.length > 0 ? (
            <span className={`chat-char-count ${inputMessage.length > 900 ? 'warning' : ''}`}>
              {inputMessage.length}/1000
            </span>
          ) : (
            <span className="chat-hint">
              Ask about any metric or model implemented in Gala Analytics
            </span>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Chat;
