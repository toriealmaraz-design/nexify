/**
 * Nexa AI Assistant Page — Nexify Platform
 * Split layout: left sidebar + main chat area
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Send,
  Trash2,
  Menu,
  X,
  Zap,
  ChevronRight,
} from 'lucide-react';
import NexaAvatar from '../../components/common/NexaAvatar';
import NexaIcon from '../../components/common/NexaIcon';

// ─── Mock conversation history ──────────────────────────────────
const MOCK_CONVERSATIONS = [
  { id: 'c1', title: 'Creator earnings overview', date: 'Today' },
  { id: 'c2', title: 'How to increase course sales', date: 'Yesterday' },
  { id: 'c3', title: 'Affiliate link strategy', date: 'Jul 12' },
  { id: 'c4', title: 'Student progress help', date: 'Jul 10' },
  { id: 'c5', title: 'Platform analytics', date: 'Jul 08' },
];

// ─── Suggested prompts (shown on empty chat) ────────────────────
const SUGGESTED_PROMPTS = [
  { icon: Zap, text: 'Give me a platform overview' },
  { icon: Zap, text: 'How are my courses performing?' },
  { icon: Zap, text: 'Summarize my affiliate metrics' },
  { icon: Zap, text: 'What courses are pending review?' },
];

// ─── Markdown-like formatter ─────────────────────────────────────
function renderMessage(text) {
  if (!text) return null;
  const lines = text.split('\n');
  return lines.map((line, i) => {
    // Bold: **text**
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <p key={i} className="mb-1 last:mb-0">
        {parts.map((part, j) =>
          part.startsWith('**') && part.endsWith('**') ? (
            <strong key={j} className="font-semibold text-white">
              {part.slice(2, -2)}
            </strong>
          ) : (
            <span key={j}>{part}</span>
          )
        )}
      </p>
    );
  });
}

// ─── Message Bubble ─────────────────────────────────────────────
function MessageBubble({ role, content }) {
  if (role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[70%] bg-[#7C3AED]/20 border border-[#7C3AED]/40 rounded-2xl rounded-br-sm px-4 py-3 text-sm text-white/90">
          {content}
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-3">
      <NexaAvatar size="sm" />
      <div className="max-w-[75%] bg-[#1E1B4B] border border-white/10 rounded-2xl rounded-bl-sm px-4 py-3 text-sm text-white/80 leading-relaxed">
        {renderMessage(content)}
      </div>
    </div>
  );
}

// ─── Thinking Indicator ─────────────────────────────────────────
function ThinkingIndicator() {
  return (
    <div className="flex gap-3">
      <NexaAvatar size="sm" />
      <div className="bg-[#1E1B4B] border border-white/10 rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-white/50">
          <span className="w-1.5 h-1.5 bg-[#7C3AED] rounded-full animate-pulse" />
          <span className="w-1.5 h-1.5 bg-[#7C3AED] rounded-full animate-pulse delay-100" />
          <span className="w-1.5 h-1.5 bg-[#7C3AED] rounded-full animate-pulse delay-200" />
          <span className="ml-1">Nexa is thinking...</span>
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton Loader ─────────────────────────────────────────────
function ChatSkeleton() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <NexaAvatar size="lg" />
        <div className="w-32 h-3 bg-white/5 rounded-full animate-pulse" />
      </div>
    </div>
  );
}

// ─── Nexa Page ──────────────────────────────────────────────────
export default function Nexa() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, thinking, scrollToBottom]);

  // Auto-grow textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  }, [input]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || thinking) return;
    const token = localStorage.getItem('nexify_token');
    if (!token) {
      // Prompt user to sign in — Nexa requires authentication
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'nexa',
          content: 'Please sign in to chat with Nexa.',
        },
      ]);
      return;
    }

    const userMsg = { id: Date.now(), role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setThinking(true);

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const body = { prompt: text, conversationId: activeConvId || undefined };
      const res = await fetch('/api/v1/nexa/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      const reply = data?.data?.response || 'Nexa is unavailable right now.';
      const convId = data?.data?.conversationId;
      if (convId && !activeConvId) setActiveConvId(convId);
      setMessages(prev => [
        ...prev,
        { id: Date.now() + 1, role: 'nexa', content: reply },
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'nexa',
          content: 'Nexa is unavailable right now. Please try again.',
        },
      ]);
    } finally {
      setThinking(false);
    }
  };

  const handleKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePrompt = promptText => {
    setInput(promptText);
  };

  const clearChat = () => {
    setMessages([]);
    setActiveConvId(null);
  };

  const selectConversation = id => {
    setActiveConvId(id);
    setMessages([]);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-white flex">
      {/* ─── Mobile sidebar overlay ─── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ─── Sidebar ─── */}
      <aside
        className={`
          fixed md:relative z-40 h-full w-[280px] bg-[#0B1120] border-r border-white/5
          flex flex-col flex-shrink-0 transition-transform duration-200
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Brand */}
        <div className="px-4 py-5 border-b border-white/5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <NexaAvatar size="sm" />
            <div>
              <span className="font-semibold text-white text-sm">Nexa</span>
              <p className="text-[10px] text-white/40 leading-none">AI Assistant</p>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-white/50 hover:text-white"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* New Chat */}
        <div className="px-3 pt-4 pb-2">
          <button
            onClick={clearChat}
            className="w-full flex items-center gap-2 px-3 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] rounded-xl text-sm font-medium transition-colors"
          >
            <NexaIcon className="w-4 h-4" />
            New Chat
          </button>
        </div>

        {/* Conversation list */}
        <nav className="flex-1 overflow-y-auto px-3 pt-2 pb-4 space-y-0.5">
          <p className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-white/30 font-semibold">
            History
          </p>
          {MOCK_CONVERSATIONS.map(conv => (
            <button
              key={conv.id}
              onClick={() => selectConversation(conv.id)}
              className={`
                w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-sm transition-all
                ${
                  activeConvId === conv.id
                    ? 'bg-white/10 text-white'
                    : 'text-white/50 hover:bg-white/5 hover:text-white/80'
                }
              `}
            >
              <MessageSquare className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 truncate">{conv.title}</span>
              <ChevronRight className="w-3 h-3 flex-shrink-0 opacity-40" />
            </button>
          ))}
        </nav>
      </aside>

      {/* ─── Main chat area ─── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="h-16 border-b border-white/5 px-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden text-white/50 hover:text-white"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <NexaAvatar size="sm" />
            <div>
              <h1 className="text-sm font-semibold text-white leading-none">
                {activeConvId
                  ? MOCK_CONVERSATIONS.find(c => c.id === activeConvId)?.title
                  : 'New Conversation'}
              </h1>
              <p className="text-[10px] text-white/40 mt-0.5">
                {activeConvId
                  ? MOCK_CONVERSATIONS.find(c => c.id === activeConvId)?.date
                  : ''}
              </p>
            </div>
          </div>
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="text-white/40 hover:text-white/70 transition-colors"
              aria-label="Clear chat"
              title="Clear chat"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {initialLoading ? (
            <ChatSkeleton />
          ) : messages.length === 0 && !thinking ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center h-full text-center">
              <NexaAvatar size="lg" />
              <h2 className="mt-4 text-lg font-semibold text-white">
                How can Nexa help you?
              </h2>
              <p className="mt-1 text-sm text-white/40 max-w-sm">
                Ask about your courses, earnings, platform analytics, or anything
                related to your role on Nexify.
              </p>
              {/* Suggested prompts */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                {SUGGESTED_PROMPTS.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => handlePrompt(p.text)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#1E1B4B] border border-white/10 hover:border-[#7C3AED]/40 rounded-xl text-left text-sm text-white/70 hover:text-white transition-all"
                  >
                    <p.icon className="w-4 h-4 text-[#7C3AED] flex-shrink-0" />
                    <span className="flex-1">{p.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map(msg => (
                <MessageBubble key={msg.id} role={msg.role} content={msg.content} />
              ))}
              {thinking && <ThinkingIndicator />}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input area */}
        <div className="px-4 pb-6 pt-2 flex-shrink-0">
          <div className="relative flex items-end gap-3 bg-[#1E1B4B] border border-white/10 rounded-2xl px-4 py-3 focus-within:border-[#7C3AED]/50 transition-colors">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Nexa something..."
              rows={1}
              className="flex-1 bg-transparent text-sm text-white placeholder-white/30 resize-none focus:outline-none min-h-[24px] max-h-[120px] leading-relaxed"
              style={{ height: 'auto' }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || thinking}
              className="w-8 h-8 bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-30 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
              aria-label="Send message"
            >
              <Send className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
          <p className="mt-2 text-center text-[10px] text-white/20">
            Shift + Enter for newline &middot; Enter to send
          </p>
        </div>
      </div>
    </div>
  );
}
