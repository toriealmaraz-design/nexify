/**
 * Nexa AI Assistant — Redesigned (Claude/Gemini-inspired)
 * Clean sidebar + main chat, role-aware prompts, conversation history
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Send, Plus, Trash2, X, Menu,
  ChevronRight, User, Lightbulb, BarChart3, BookOpen, HelpCircle
} from 'lucide-react';
import NexaAvatar from '../../components/common/NexaAvatar';
import { useAuth } from '../../context/AuthContext';

// ─── Role-based quick actions ──────────────────────────────────
const QUICK_ACTIONS = {
  STUDENT: [
    { icon: BookOpen, label: 'My progress', prompt: 'Show my course progress and streaks' },
    { icon: Lightbulb, label: 'Study tips', prompt: 'Give me study tips for my enrolled courses' },
    { icon: BarChart3, label: 'Points & levels', prompt: 'Explain my gamification points and how to level up' },
    { icon: HelpCircle, label: 'Find courses', prompt: 'What courses do you recommend for me?' },
  ],
  CREATOR: [
    { icon: BarChart3, label: 'Earnings', prompt: 'Show my earnings overview' },
    { icon: Lightbulb, label: 'Course tips', prompt: 'How can I improve my course conversions?' },
    { icon: BookOpen, label: 'Best practices', prompt: 'What makes a successful course on Nexify?' },
    { icon: HelpCircle, label: 'Pricing', prompt: 'Help me price my new course' },
  ],
  AFFILIATE: [
    { icon: BarChart3, label: 'Commissions', prompt: 'Show my affiliate commission summary' },
    { icon: Lightbulb, label: 'Promo tips', prompt: 'How can I promote my affiliate links better?' },
    { icon: BookOpen, label: 'Top courses', prompt: 'Which courses convert best for affiliates?' },
    { icon: HelpCircle, label: 'Links', prompt: 'Help me generate affiliate copy' },
  ],
  ADMIN: [
    { icon: BarChart3, label: 'Platform overview', prompt: 'Give me a platform-wide summary' },
    { icon: User, label: 'User stats', prompt: 'Show user growth and role breakdown' },
    { icon: BookOpen, label: 'Staging queue', prompt: 'What courses are pending review?' },
    { icon: Lightbulb, label: 'Revenue', prompt: 'Show revenue analytics and top earners' },
  ],
};

// ─── Markdown renderer ─────────────────────────────────────────
function renderMessage(text) {
  if (!text) return null;
  const lines = text.split('\n');
  return lines.map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <p key={i} className="mb-1.5 last:mb-0 leading-relaxed">
        {parts.map((part, j) =>
          part.startsWith('**') && part.endsWith('**') ? (
            <strong key={j} className="font-semibold text-white">{part.slice(2, -2)}</strong>
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
        <div className="max-w-[75%] bg-[#7C3AED] rounded-2xl rounded-br-md px-4 py-3 text-sm text-white">
          {content}
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 mt-1"><NexaAvatar size="sm" /></div>
      <div className="max-w-[80%] bg-[#1E293B] border border-white/10 rounded-2xl rounded-bl-md px-4 py-3 text-sm text-white/80">
        {renderMessage(content)}
      </div>
    </div>
  );
}

// ─── Thinking Indicator ─────────────────────────────────────────
function ThinkingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 mt-1"><NexaAvatar size="sm" /></div>
      <div className="bg-[#1E293B] border border-white/10 rounded-2xl rounded-bl-md px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-[#7C3AED] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-[#7C3AED] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-[#7C3AED] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────
export default function Nexa() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const role = user?.role || 'STUDENT';
  const quickActions = QUICK_ACTIONS[role] || QUICK_ACTIONS.STUDENT;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || thinking) return;

    const token = localStorage.getItem('nexify_token');
    const userMsg = { id: Date.now(), role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setThinking(true);

    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch('/api/v1/nexa/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ prompt: text }),
      });
      const data = await res.json();
      const reply = data?.data?.response || data?.data?.reply || "I'm not sure how to help with that. Try asking about your courses, progress, or earnings.";
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'nexa', content: reply }]);
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now() + 1, role: 'nexa',
        content: "I'm having trouble connecting right now. Please try again in a moment."
      }]);
    } finally {
      setThinking(false);
    }
  };

  const handleKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const startNewChat = () => { setMessages([]); setSidebarOpen(false); };

  return (
    <div className="min-h-screen bg-[#0F172A] text-white flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ─── Sidebar ─── */}
      <aside className={`
        fixed lg:relative z-40 h-full w-72 bg-[#0B1120] border-r border-white/5
        flex flex-col flex-shrink-0 transition-transform duration-300 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 bg-[#7C3AED] rounded-lg flex items-center justify-center">
                <span className="text-black font-bold text-sm">N</span>
              </div>
              <span className="font-bold text-white">Nexify</span>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white/50 hover:text-white p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-3">
          <button onClick={startNewChat}
            className="w-full flex items-center gap-2 px-3 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] rounded-xl text-sm font-semibold transition-colors">
            <Plus className="w-4 h-4" /> New Chat
          </button>
        </div>

        <div className="px-3 pb-2">
          <p className="px-2 py-1 text-[10px] uppercase tracking-wider text-white/30 font-semibold">Quick Actions</p>
          <div className="space-y-0.5">
            {quickActions.map((action, i) => (
              <button key={i} onClick={() => { setInput(action.prompt); inputRef.current?.focus(); setSidebarOpen(false); }}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-sm text-white/60 hover:bg-white/5 hover:text-white transition-all">
                <action.icon className="w-4 h-4 text-[#7C3AED] flex-shrink-0" />
                <span className="truncate">{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-auto p-3 border-t border-white/5">
          <Link to={role === 'ADMIN' ? '/admin' : role === 'CREATOR' ? '/creator' : role === 'AFFILIATE' ? '/affiliate' : '/student'}
            className="flex items-center gap-2 px-3 py-2 text-sm text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-all">
            <ChevronRight className="w-4 h-4 rotate-180" />
            Back to Dashboard
          </Link>
        </div>
      </aside>

      {/* ─── Main Chat Area ─── */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-14 border-b border-white/5 px-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-white/50 hover:text-white p-1">
              <Menu className="w-5 h-5" />
            </button>
            <NexaAvatar size="sm" />
            <div>
              <h1 className="text-sm font-semibold text-white leading-none">Nexa AI</h1>
              <p className="text-[10px] text-emerald-400 mt-0.5">● Online</p>
            </div>
          </div>
          {messages.length > 0 && (
            <button onClick={startNewChat} className="text-white/40 hover:text-white transition-colors p-1.5 hover:bg-white/5 rounded-lg" title="Clear chat">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 && !thinking ? (
            <div className="flex flex-col items-center justify-center h-full px-4 text-center">
              <NexaAvatar size="lg" />
              <h2 className="mt-5 text-xl font-bold text-white">How can Nexa help you?</h2>
              <p className="mt-2 text-sm text-white/40 max-w-md">
                Your AI assistant for everything Nexify — courses, earnings, analytics, and more.
              </p>
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
                {quickActions.map((action, i) => (
                  <button key={i} onClick={() => { setInput(action.prompt); inputRef.current?.focus(); }}
                    className="flex items-center gap-3 px-4 py-3 bg-[#1E293B] border border-white/10 hover:border-[#7C3AED]/50 hover:bg-[#1E1B4B]/80 rounded-xl text-left transition-all group">
                    <div className="w-9 h-9 bg-[#7C3AED]/10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-[#7C3AED]/20 transition-colors">
                      <action.icon className="w-4 h-4 text-[#7C3AED]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{action.label}</p>
                      <p className="text-xs text-white/40 line-clamp-1">{action.prompt}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
              {messages.map(msg => (
                <MessageBubble key={msg.id} role={msg.role} content={msg.content} />
              ))}
              {thinking && <ThinkingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="px-4 pb-4 pt-2 flex-shrink-0">
          <div className="max-w-3xl mx-auto">
            <div className="relative flex items-end gap-2 bg-[#1E293B] border border-white/10 rounded-2xl px-4 py-3 focus-within:border-[#7C3AED]/50 focus-within:ring-1 focus-within:ring-[#7C3AED]/20 transition-all">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Nexa anything..."
                rows={1}
                className="flex-1 bg-transparent text-sm text-white placeholder-white/30 resize-none focus:outline-none min-h-[24px] max-h-[160px] leading-relaxed"
                style={{ height: 'auto', overflowY: input.split('\n').length > 4 ? 'auto' : 'hidden' }}
              />
              <button onClick={handleSend} disabled={!input.trim() || thinking}
                className="w-9 h-9 bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-30 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-all flex-shrink-0 mb-0.5"
                aria-label="Send">
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
            <p className="mt-2 text-center text-[10px] text-white/20">
              Shift+Enter for new line · Nexa can make mistakes — verify important info
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
