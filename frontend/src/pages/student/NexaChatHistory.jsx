/**
 * NexaChatHistory — Persistent chat history per user
 * Lists conversations + message thread view
 */
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Trash2, MessageSquare, Send, Plus, ChevronLeft, Bot, User } from 'lucide-react';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function Avatar({ role, size = 'sm' }) {
  const cls = size === 'sm' ? 'w-7 h-7' : 'w-8 h-8';
  if (role === 'nexa') return <div className={`${cls} rounded-full bg-[#7C3AED]/20 flex items-center justify-center flex-shrink-0`}><Bot className="w-4 h-4 text-[#7C3AED]" /></div>;
  return <div className={`${cls} rounded-full bg-white/10 flex items-center justify-center flex-shrink-0`}><User className="w-4 h-4 text-white/50" /></div>;
}

export default function NexaChatHistory() {
  const { api } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { fetchConversations(); }, []);

  useEffect(() => { if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const fetchConversations = async () => {
    try {
      const res = await api.get('/nexa-chat/conversations');
      setConversations(res.data.data || []);
    } catch {} finally { setLoading(false); }
  };

  const openConversation = async (conv) => {
    setActiveConv(conv);
    setLoadingMessages(true);
    try {
      const res = await api.get(`/nexa-chat/conversations/${conv.id}`);
      setMessages(res.data.data.messages || []);
    } catch { setMessages([]); } finally { setLoadingMessages(false); }
  };

  const deleteConversation = async (id, e) => {
    e.stopPropagation();
    try {
      await api.delete(`/nexa-chat/conversations/${id}`);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (activeConv?.id === id) setActiveConv(null);
    } catch {}
  };

  const sendMessage = async () => {
    if (!prompt.trim() || sending) return;
    const userPrompt = prompt.trim();
    setPrompt('');
    setSending(true);

    // Optimistic user message
    const tempConvId = activeConv?.id;
    const optimisticUserMsg = { id: 'temp-' + Date.now(), role: 'user', content: userPrompt, createdAt: new Date().toISOString() };
    if (activeConv) setMessages(prev => [...prev, optimisticUserMsg]);

    try {
      const res = await api.post('/nexa-chat/chat', {
        prompt: userPrompt,
        conversationId: tempConvId || undefined,
      });
      const { reply, conversationId } = res.data.data;

      if (!tempConvId && conversationId) {
        setActiveConv({ id: conversationId, title: userPrompt.substring(0, 60) });
        fetchConversations();
      }

      setMessages(prev => [
        ...prev.filter(m => m.id !== 'temp-' + Date.now()),
        { id: 'temp-' + Date.now(), role: 'user', content: userPrompt, createdAt: new Date().toISOString() },
        { id: 'nexa-' + Date.now(), role: 'nexa', content: reply, createdAt: new Date().toISOString() },
      ]);
    } catch {
      setMessages(prev => prev.filter(m => !m.id?.startsWith('temp-')));
    } finally { setSending(false); }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <div className="flex items-center gap-3 mb-6">
        {activeConv && (
          <button onClick={() => setActiveConv(null)} className="text-white/40 hover:text-white transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2"><MessageSquare className="w-5 h-5 text-[#7C3AED]" />Nexa Chat History</h1>
          <p className="text-xs text-white/40 mt-0.5">Your conversations with Nexa AI</p>
        </div>
      </div>

      <div className="bg-[#1E293B] border border-white/10 rounded-2xl overflow-hidden" style={{ height: 'calc(100vh - 180px)' }}>
        {!activeConv ? (
          /* Conversation list */
          <div className="p-4 space-y-2 overflow-y-auto h-full">
            <button onClick={() => openConversation({ id: null, title: 'New Chat' })}
              className="w-full flex items-center gap-3 px-4 py-3 bg-[#7C3AED]/10 hover:bg-[#7C3AED]/20 border border-[#7C3AED]/20 rounded-xl transition-colors">
              <Plus className="w-4 h-4 text-[#7C3AED]" />
              <span className="text-sm text-[#7C3AED] font-medium">New Conversation</span>
            </button>

            {loading ? (
              <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />)}</div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-12 text-white/30 text-sm">No conversations yet. Start one above!</div>
            ) : (
              conversations.map(conv => (
                <div key={conv.id}
                  onClick={() => openConversation(conv)}
                  className="flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl cursor-pointer transition-colors group">
                  <MessageSquare className="w-4 h-4 text-white/30 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{conv.title || 'Untitled'}</p>
                    <p className="text-[11px] text-white/30">{conv.messages?.[0]?.content?.substring(0, 50) || timeAgo(conv.updatedAt)}</p>
                  </div>
                  <span className="text-[10px] text-white/20 flex-shrink-0">{timeAgo(conv.updatedAt)}</span>
                  <button onClick={(e) => deleteConversation(conv.id, e)}
                    className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 transition-all flex-shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        ) : (
          /* Message thread */
          <div className="flex flex-col h-full">
            {/* Thread header */}
            <div className="px-4 py-3 border-b border-white/5 flex items-center gap-3">
              <MessageSquare className="w-4 h-4 text-[#7C3AED]" />
              <span className="text-sm text-white font-medium truncate flex-1">{activeConv.title || 'New Chat'}</span>
              <button onClick={(e) => deleteConversation(activeConv.id, e)} className="text-white/30 hover:text-red-400 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loadingMessages ? (
                <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />)}</div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12 text-white/30 text-sm">Start the conversation — Nexa is listening.</div>
              ) : (
                messages.map((msg, i) => (
                  <div key={msg.id || i} className={`flex items-start gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <Avatar role={msg.role} />
                    <div className={`max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                      <div className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-[#7C3AED] text-white rounded-tr-sm'
                          : 'bg-white/10 text-white/80 rounded-tl-sm'
                      }`}>
                        {msg.content}
                      </div>
                      <span className="text-[10px] text-white/20 px-1">{timeAgo(msg.createdAt)}</span>
                    </div>
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/5">
              <div className="flex items-end gap-2">
                <textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder="Ask Nexa anything..."
                  rows={1}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] resize-none"
                />
                <button onClick={sendMessage} disabled={!prompt.trim() || sending}
                  className="bg-[#7C3AED] hover:bg-[#8b5cf6] disabled:opacity-40 text-white p-3 rounded-xl transition-colors">
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[10px] text-white/20 mt-2 text-center">Press Enter to send · Nexa retains context from this conversation</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
