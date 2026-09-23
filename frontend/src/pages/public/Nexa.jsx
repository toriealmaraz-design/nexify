/**
 * Nexa AI Assistant — Full conversation management + role-aware
 * Claude/Gemini-inspired with persistent chat history
 */
import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Send, Plus, Trash2, X, Menu, ChevronRight, User, Lightbulb,
  BarChart3, BookOpen, HelpCircle, MessageSquare, Settings
} from 'lucide-react';
import NexaAvatar from '../../components/common/NexaAvatar';
import { useAuth } from '../../context/AuthContext';

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

const ROLE_NAMES = { STUDENT: 'Student', CREATOR: 'Creator', AFFILIATE: 'Affiliate', ADMIN: 'Admin' };

// ─── Full Markdown renderer ────────────────────────────────────
function renderMarkdown(text) {
  if (!text) return null;
  const lines = text.split('\n');
  const elements = [];
  let listItems = [];
  let inCodeBlock = false;
  let codeContent = [];

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="list-disc list-inside space-y-1 my-2 text-white/80">
          {listItems.map((item, i) => <li key={i} className="leading-relaxed">{item}</li>)}
        </ul>
      );
      listItems = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code blocks
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre key={`code-${i}`} className="bg-[#0B1120] border border-white/10 rounded-lg p-3 my-2 overflow-x-auto text-xs text-emerald-300 font-mono">
            <code>{codeContent.join('\n')}</code>
          </pre>
        );
        codeContent = [];
        inCodeBlock = false;
      } else {
        flushList();
        inCodeBlock = true;
      }
      continue;
    }
    if (inCodeBlock) { codeContent.push(line); continue; }

    // Horizontal rule
    if (line.match(/^---+$/)) {
      flushList();
      elements.push(<hr key={`hr-${i}`} className="border-white/10 my-3" />);
      continue;
    }

    // Headers
    if (line.startsWith('### ')) {
      flushList();
      elements.push(<h4 key={i} className="text-sm font-bold text-white mt-3 mb-1">{renderInline(line.slice(4))}</h4>);
      continue;
    }
    if (line.startsWith('## ')) {
      flushList();
      elements.push(<h3 key={i} className="text-base font-bold text-white mt-3 mb-1">{renderInline(line.slice(3))}</h3>);
      continue;
    }
    if (line.startsWith('# ')) {
      flushList();
      elements.push(<h2 key={i} className="text-lg font-bold text-white mt-3 mb-1">{renderInline(line.slice(2))}</h2>);
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      flushList();
      elements.push(
        <blockquote key={i} className="border-l-2 border-[#7C3AED] pl-3 py-1 my-2 text-white/70 italic">
          {renderInline(line.slice(2))}
        </blockquote>
      );
      continue;
    }

    // List items
    if (line.match(/^[-*] /)) {
      listItems.push(renderInline(line.slice(2)));
      continue;
    }
    if (line.match(/^\d+\. /)) {
      listItems.push(renderInline(line.replace(/^\d+\. /, '')));
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      flushList();
      continue;
    }

    // Paragraph
    flushList();
    elements.push(<p key={i} className="mb-1.5 last:mb-0 leading-relaxed">{renderInline(line)}</p>);
  }
  flushList();
  return elements;
}

// ─── Inline formatting (bold, italic, code, links) ─────────────
function renderInline(text) {
  // Split by inline code first
  const codeParts = text.split(/(`[^`]+`)/g);
  return codeParts.map((part, i) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="bg-white/10 text-emerald-300 px-1.5 py-0.5 rounded text-xs font-mono">{part.slice(1, -1)}</code>;
    }
    // Bold + italic
    const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
    return boldParts.map((bp, j) => {
      if (bp.startsWith('**') && bp.endsWith('**')) {
        return <strong key={`${i}-${j}`} className="font-semibold text-white">{bp.slice(2, -2)}</strong>;
      }
      // Italic
      const italicParts = bp.split(/(\*[^*]+\*)/g);
      return italicParts.map((ip, k) => {
        if (ip.startsWith('*') && ip.endsWith('*')) {
          return <em key={`${i}-${j}-${k}`} className="italic text-white/70">{ip.slice(1, -1)}</em>;
        }
        return <span key={`${i}-${j}-${k}`}>{ip}</span>;
      });
    });
  });
}

function MessageBubble({ role, content }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (role === 'user') {
    return (
      <div className="flex justify-end animate-fade-in">
        <div className="max-w-[75%] bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] rounded-2xl rounded-br-md px-4 py-3 text-sm text-white shadow-lg shadow-[#7C3AED]/20 leading-relaxed">
          {content}
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-3 group animate-fade-in">
      <div className="flex-shrink-0 mt-0.5 relative">
        <NexaAvatar size="sm" />
        <div className="absolute -inset-0.5 rounded-full bg-[#7C3AED]/20 blur" />
      </div>
      <div className="max-w-[82%] relative">
        <div className="bg-[#1E293B]/80 backdrop-blur-sm border border-white/10 rounded-2xl rounded-bl-md px-5 py-4 text-sm text-white/80 shadow-sm shadow-black/20">
          {renderMarkdown(content)}
        </div>
        <div className="flex items-center gap-2 mt-1 px-1">
          <span className="text-[10px] text-white/20">{time}</span>
          <button onClick={handleCopy}
            className="opacity-0 group-hover:opacity-100 transition-all px-1.5 py-0.5 bg-[#0B1120]/50 border border-white/5 rounded text-[10px] text-white/40 hover:text-white hover:border-[#7C3AED]/30"
            title="Copy">
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ThinkingIndicator() {
  return (
    <div className="flex gap-3 animate-fade-in">
      <div className="flex-shrink-0 mt-0.5 relative">
        <NexaAvatar size="sm" />
        <div className="absolute -inset-1 rounded-full bg-[#7C3AED]/30 blur-sm animate-pulse" />
      </div>
      <div className="bg-[#1E293B] border border-white/10 rounded-2xl rounded-bl-md px-5 py-3 shadow-sm">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="w-1.5 h-1.5 bg-[#7C3AED] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 bg-[#7C3AED] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-1.5 h-1.5 bg-[#7C3AED] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        <p className="text-[11px] text-white/40 font-medium">Nexa is thinking</p>
      </div>
    </div>
  );
}

export default function Nexa() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const role = user?.role || 'STUDENT';
  const quickActions = QUICK_ACTIONS[role] || QUICK_ACTIONS.STUDENT;

  useEffect(() => { fetchConversations(); }, []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, thinking]);

  async function fetchConversations() {
    setLoadingConvs(true);
    try {
      const token = localStorage.getItem('nexify_token');
      const res = await fetch('/api/v1/nexa/conversations', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.data) setConversations(data.data);
    } catch { /* silent */ }
    finally { setLoadingConvs(false); }
  }

  async function loadConversation(convId) {
    setActiveConvId(convId);
    setSidebarOpen(false);
    try {
      const token = localStorage.getItem('nexify_token');
      const res = await fetch(`/api/v1/nexa/conversations/${convId}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.data?.messages) setMessages(data.data.messages.map(m => ({ id: m.id, role: m.role, content: m.content })));
    } catch { setMessages([]); }
  }

  async function deleteConversation(convId, e) {
    e.stopPropagation();
    if (!confirm('Delete this conversation?')) return;
    try {
      const token = localStorage.getItem('nexify_token');
      await fetch(`/api/v1/nexa/conversations/${convId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      setConversations(prev => prev.filter(c => c.id !== convId));
      if (activeConvId === convId) { setActiveConvId(null); setMessages([]); }
    } catch { /* silent */ }
  }

  const handleSend = async () => {
    const text = input.trim();
    if (!text || thinking) return;
    const token = localStorage.getItem('nexify_token');
    setMessages(prev => [...prev, { id: Date.now(), role: 'user', content: text }]);
    setInput('');
    setThinking(true);
    try {
      const res = await fetch('/api/v1/nexa/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ prompt: text, conversationId: activeConvId, enhanceWithLLM: true }),
      });
      const data = await res.json();
      const reply = data?.data?.reply || "I'm not sure how to help with that.";
      const convId = data?.data?.conversationId;
      if (convId && !activeConvId) { setActiveConvId(convId); fetchConversations(); }
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'nexa', content: reply }]);
    } catch {
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'nexa', content: "Connection error. Please try again." }]);
    } finally { setThinking(false); }
  };

  const handleKeyDown = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };
  const startNewChat = () => { setMessages([]); setActiveConvId(null); setSidebarOpen(false); };
  const dashLink = role === 'ADMIN' ? '/admin' : role === 'CREATOR' ? '/creator' : role === 'AFFILIATE' ? '/affiliate' : '/student';

  return (
    <div className="min-h-screen bg-[#0F172A] text-white flex">
      {sidebarOpen && <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed lg:relative z-40 h-full w-72 bg-[#0B1120] border-r border-white/5 flex flex-col flex-shrink-0 transition-transform duration-300 ease-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 hover:opacity-80">
            <div className="w-8 h-8 bg-[#7C3AED] rounded-lg flex items-center justify-center"><span className="text-black font-bold text-sm">N</span></div>
            <span className="font-bold text-white">Nexify</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white/50 hover:text-white p-1"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-3">
          <button onClick={startNewChat} className="w-full flex items-center gap-2 px-3 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] rounded-xl text-sm font-semibold transition-colors">
            <Plus className="w-4 h-4" /> New Chat
          </button>
        </div>

        <div className="px-3 pb-2">
          <p className="px-2 py-1 text-[10px] uppercase tracking-wider text-white/30 font-semibold">Quick Actions</p>
          <div className="space-y-0.5">
            {quickActions.map((a, i) => (
              <button key={i} onClick={() => { setInput(a.prompt); setActiveConvId(null); setMessages([]); inputRef.current?.focus(); setSidebarOpen(false); }}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-sm text-white/60 hover:bg-white/5 hover:text-white transition-all">
                <a.icon className="w-4 h-4 text-[#7C3AED] flex-shrink-0" /><span className="truncate">{a.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2 border-t border-white/5">
          <p className="px-2 py-1 text-[10px] uppercase tracking-wider text-white/30 font-semibold">History</p>
          {loadingConvs ? (
            <div className="px-2 py-3 space-y-2">{[1,2,3].map(i => <div key={i} className="h-8 bg-white/5 rounded-lg animate-pulse" />)}</div>
          ) : conversations.length === 0 ? (
            <p className="px-2 py-3 text-xs text-white/30">No conversations yet</p>
          ) : (
            <div className="space-y-0.5">
              {conversations.map(conv => (
                <div key={conv.id} onClick={() => loadConversation(conv.id)}
                  className={`group flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-all text-sm ${activeConvId === conv.id ? 'bg-white/10 text-white' : 'text-white/50 hover:bg-white/5 hover:text-white/80'}`}>
                  <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="flex-1 truncate text-xs">{conv.title || 'New Chat'}</span>
                  <button onClick={(e) => deleteConversation(conv.id, e)} className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-3 border-t border-white/5 space-y-1">
          {role === 'ADMIN' && (
            <Link to="/admin/nexa-settings" className="flex items-center gap-2 px-3 py-2 text-sm text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-all">
              <Settings className="w-4 h-4" /> Nexa Settings
            </Link>
          )}
          <Link to={dashLink} className="flex items-center gap-2 px-3 py-2 text-sm text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-all">
            <ChevronRight className="w-4 h-4 rotate-180" /> Back to Dashboard
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-14 border-b border-white/5 px-4 flex items-center justify-between flex-shrink-0 bg-[#0F172A]/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-white/50 hover:text-white p-1"><Menu className="w-5 h-5" /></button>
            <div className="relative">
              <NexaAvatar size="sm" />
              <div className="absolute -inset-0.5 rounded-full bg-emerald-400/30 blur" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-white leading-none">Nexa AI</h1>
              <p className="text-[10px] text-white/40 mt-0.5">{ROLE_NAMES[role]} mode</p>
            </div>
          </div>
          {messages.length > 0 && (
            <button onClick={startNewChat} className="text-white/40 hover:text-white p-1.5 hover:bg-white/5 rounded-lg transition-colors"><Plus className="w-4 h-4" /></button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 && !thinking ? (
            <div className="flex flex-col items-center justify-center h-full px-4 text-center relative overflow-hidden">
              {/* Background glow */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[500px] h-[500px] rounded-full bg-[#7C3AED]/5 blur-[120px]" />
              </div>
              <div className="relative z-10">
                <div className="relative inline-block mb-6">
                  <NexaAvatar size="lg" />
                  <div className="absolute -inset-2 rounded-full bg-[#7C3AED]/20 blur-lg animate-pulse" />
                </div>
                <h2 className="text-xl font-bold text-white">How can Nexa help you?</h2>
                <p className="mt-2 text-sm text-white/40 max-w-md">
                  Your AI assistant for everything Nexify. <span className="text-[#7C3AED]">{ROLE_NAMES[role]} mode</span> — responses tailored to your role.
                </p>
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
                  {quickActions.map((a, i) => (
                    <button key={i} onClick={() => { setInput(a.prompt); inputRef.current?.focus(); }}
                      className="flex items-center gap-3 px-4 py-3 bg-[#1E293B]/60 border border-white/10 hover:border-[#7C3AED]/40 hover:bg-[#1E1B4B]/60 rounded-xl text-left transition-all group backdrop-blur-sm">
                      <div className="w-9 h-9 bg-[#7C3AED]/10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-[#7C3AED]/20 transition-colors">
                        <a.icon className="w-4 h-4 text-[#7C3AED]" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{a.label}</p>
                        <p className="text-xs text-white/40 line-clamp-1">{a.prompt}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
              {messages.map(msg => <MessageBubble key={msg.id} role={msg.role} content={msg.content} />)}
              {thinking && <ThinkingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="px-4 pb-4 pt-2 flex-shrink-0">
          <div className="max-w-3xl mx-auto">
            <div className="relative flex items-end gap-2 bg-[#1E293B]/60 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-3 focus-within:border-[#7C3AED]/50 focus-within:ring-1 focus-within:ring-[#7C3AED]/20 transition-all">
              <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
                placeholder="Ask Nexa anything..." rows={1}
                className="flex-1 bg-transparent text-sm text-white placeholder-white/30 resize-none focus:outline-none min-h-[24px] max-h-[160px] leading-relaxed"
                style={{ height: 'auto', overflowY: input.split('\n').length > 4 ? 'auto' : 'hidden' }} />
              <button onClick={handleSend} disabled={!input.trim() || thinking}
                className="w-9 h-9 bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] hover:from-[#8B5CF6] hover:to-[#7C3AED] disabled:opacity-30 disabled:hover:from-[#7C3AED] disabled:hover:to-[#6D28D9] rounded-xl flex items-center justify-center flex-shrink-0 mb-0.5 shadow-lg shadow-[#7C3AED]/20 transition-all active:scale-95">
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
            <p className="mt-2 text-center text-[10px] text-white/20">Shift+Enter for new line · Nexa can make mistakes — verify important info</p>
          </div>
        </div>
      </div>
    </div>
  );
}
