/**
 * NexaWidget — Floating AI Chat Button (Duolingo-style)
 * Single button on screen; click to open full panel.
 * Voice mode: click mic, speak, text appears, Nexa answers.
 * Context-aware: reads current page route to build role-scoped context.
 * Never auto-opens on login — stays closed until user clicks.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import NexaAvatar from './common/NexaAvatar';
import NexaIcon from './common/NexaIcon';
import {
  Send,
  X,
  Minus,
  Brain,
  Sparkles,
  Cpu,
  Mic,
  MicOff,
  XCircle,
} from 'lucide-react';

const SPRING = { type: 'spring', stiffness: 400, damping: 28 };

export default function NexaWidget() {
  const { isAuthenticated, user, api } = useAuth();
  const [panelOpen, setPanelOpen] = useState(false); // NEVER auto-true — always starts closed
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const [nexaConfig, setNexaConfig] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [speechError, setSpeechError] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const panelRef = useRef(null);

  // Fetch Nexa global config once on mount
  useEffect(() => {
    api.get('/nexa-config')
      .then(r => setNexaConfig(r.data.data?.[0] || null))
      .catch(() => setNexaConfig(null));
  }, [api]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (!minimized && panelOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, minimized, panelOpen]);

  // Focus input when panel opens
  useEffect(() => {
    if (panelOpen && !minimized && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [panelOpen, minimized]);

  // Close on click outside panel
  useEffect(() => {
    function handleClickOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        const fab = document.querySelector('[data-nexa-fab]');
        if (!fab?.contains(e.target)) {
          setPanelOpen(false);
          setMinimized(false);
        }
      }
    }
    if (panelOpen && !minimized) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [panelOpen, minimized]);

  // ─── Speech Recognition ───────────────────────────────────────
  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechError('Speech not supported in this browser. Try Chrome.');
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setSpeechError('');
    };

    recognition.onresult = (event) => {
      const results = Array.from(event.results);
      const transcriptText = results.map(r => r[0].transcript).join('');
      setTranscript(transcriptText);
      setInputValue(transcriptText);
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      if (event.error === 'not-allowed') {
        setSpeechError('Microphone access denied. Check browser permissions.');
      } else if (event.error !== 'aborted') {
        setSpeechError(`Speech error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.abort();
    setIsListening(false);
  }, []);

  // ─── Role + Page context builder ─────────────────────────────
  const buildPageContext = useCallback(() => {
    const route = window.location.pathname;
    const role = user?.role || 'STUDENT';

    // Define what each page IS and what Nexa should know about it
    const pageContexts = {
      STUDENT: {
        '/':              { page: 'Public Landing', note: 'Explore and enroll in courses' },
        '/student':       { page: 'Student Dashboard', note: 'Overview: enrolled courses, progress, recommendations' },
        '/student/courses':{ page: 'My Courses', note: 'All enrolled courses with progress tracking' },
        '/student/earnings':{ page: 'Earnings', note: 'Rewards and earnings from course referrals' },
        '/cart':          { page: 'Shopping Cart', note: 'Courses ready for checkout' },
        '/checkout':      { page: 'Checkout', note: 'Payment and enrollment' },
        '/course/:id':    { page: 'Course Detail', note: 'Course info, curriculum, enrollment' },
        '/student/course/:id': { page: 'Course Player', note: 'Watching lessons, completing tasks, course progress' },
        '/profile':       { page: 'My Profile', note: 'Account settings and profile info' },
      },
      CREATOR: {
        '/':              { page: 'Public Landing', note: 'Explore and manage courses' },
        '/creator':       { page: 'Creator Dashboard', note: 'Overview: courses, students, earnings, analytics' },
        '/creator/courses':{ page: 'My Courses', note: 'Manage all creator courses, upload content' },
        '/creator/course/new': { page: 'Course Builder', note: 'Creating a new course from scratch' },
        '/creator/assets':{ page: 'Asset Manager', note: 'Managing course media: videos, images, PDFs' },
        '/creator/analytics':{ page: 'Analytics', note: 'Course performance, student metrics, revenue' },
        '/creator/earnings':{ page: 'Earnings & Payouts', note: 'Revenue, pending payouts, payout settings' },
        '/creator/referrals':{ page: 'Referral Program', note: 'Affiliate links and referral performance' },
        '/creator/staging':{ page: 'Staging Queue', note: 'Courses awaiting admin review before publishing' },
        '/profile':       { page: 'My Profile', note: 'Account settings and payout info' },
      },
      AFFILIATE: {
        '/':              { page: 'Public Landing', note: 'Explore and promote courses' },
        '/affiliate':     { page: 'Affiliate Dashboard', note: 'Overview: referrals, commissions, promo tools' },
        '/affiliate/tools':{ page: 'Promoter Tools', note: 'WhatsApp scripts, TikTok hooks, email templates, banners' },
        '/affiliate/links':{ page: 'Link Generator', note: 'Create and manage affiliate tracking links' },
        '/affiliate/earnings':{ page: 'Earnings', note: 'Commission history and pending payouts' },
        '/profile':       { page: 'My Profile', note: 'Account settings and payout info' },
      },
      ADMIN: {
        '/':              { page: 'Public Landing', note: 'Platform overview' },
        '/admin':         { page: 'Admin Dashboard', note: 'Platform metrics: users, revenue, course approvals' },
        '/admin/users':   { page: 'User Management', note: 'All platform users across all roles' },
        '/admin/staging': { page: 'Staging Queue', note: 'Creator courses pending review and approval' },
        '/admin/assets':  { page: 'Asset Manager', note: 'Platform-wide media assets' },
        '/admin/nexa':    { page: 'Nexa Settings', note: 'Configure Nexa AI: name, prompt, fee rates, widget' },
        '/admin/analytics':{ page: 'Analytics Dashboard', note: 'Platform analytics and metrics' },
        '/admin/ad-manager':{ page: 'Ad Manager', note: 'Platform advertisements and promotions' },
        '/profile':       { page: 'My Profile', note: 'Account settings' },
      },
    };

    // Match route against known pages (handle params like /course/:id)
    const rolePages = pageContexts[role] || pageContexts.STUDENT;
    let matched = rolePages[route] || { page: 'Unknown Page', note: 'Navigate to a specific section for targeted help' };

    // Fallback: match /:prefix routes
    if (!rolePages[route]) {
      for (const [key, val] of Object.entries(rolePages)) {
        if (route.startsWith(key.replace(/:[^/]+/g, '')) && key.includes('/')) {
          matched = val;
          break;
        }
      }
    }

    return {
      role,
      ...matched,
      route,
      // Role capability summary for Nexa to reason with
      roleCapabilities: {
        STUDENT:  ['enroll in courses', 'watch lessons', 'track progress', 'refer friends for rewards', 'earn commission'],
        CREATOR:  ['create courses', 'upload content', 'set pricing', 'view analytics', 'manage staging courses', 'request payouts'],
        AFFILIATE:['promote courses', 'generate tracking links', 'use promo templates', 'earn commission on sales', 'request payouts'],
        ADMIN:    ['approve/reject courses', 'manage users', 'set platform fees', 'configure Nexa', 'view all metrics'],
      }[role] || [],
    };
  }, [user]);

  // ─── Send message ────────────────────────────────────────────
  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || sending) return;
    const userRole = user?.role || 'STUDENT';

    const userMsg = { id: Date.now(), role: 'user', text: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setTranscript('');
    setSending(true);

    const pageContext = buildPageContext();

    try {
      const res = await api.post('/nexa/chat', {
        prompt: text.trim(),
        role: userRole,
        // Rich page+role context so Nexa understands WHERE the user is
        pageContext,
      });
      const nexaText = res.data?.data?.reply || res.data?.data?.response || res.data?.message || "I'm here! Ask me anything.";
      const usedLLM = res.data?.data?.usedLLM;
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'nexa', text: nexaText, usedLLM }]);
    } catch (llmErr) {
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'nexa', text: "I'm sorry — Nexa is currently unavailable. Please try again." }]);
    } finally {
      setSending(false);
    }
  }, [sending, user, api, buildPageContext]);

  const handleSend = useCallback(() => {
    if (isListening) {
      stopListening();
    }
    sendMessage(inputValue);
  }, [inputValue, sendMessage, isListening, stopListening]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleToggle = useCallback(() => {
    if (panelOpen) {
      setPanelOpen(false);
      setMinimized(false);
    } else {
      setPanelOpen(true);
      setMinimized(false);
    }
  }, [panelOpen, minimized]);

  const handleMinimize = useCallback(() => {
    setMinimized(true);
  }, []);

  const handleClose = useCallback(() => {
    setPanelOpen(false);
    setMinimized(false);
    setMessages([]);
    setInputValue('');
    setTranscript('');
    setSpeechError('');
  }, []);

  if (!isAuthenticated) return null;

  const nexaName = nexaConfig?.name || 'Nexa';
  const nexaAvatar = nexaConfig?.avatar || null;
  const isLeft = (nexaConfig?.widgetPosition || 'bottom-right') === 'bottom-left';

  // ─── FAB ────────────────────────────────────────────────────
  const FAB = (
    <motion.div
      data-nexa-fab
      data-tour="nexa-widget-fab"
      className={`
        fixed z-[9999] flex items-center justify-center rounded-full shadow-2xl cursor-pointer
        ${isLeft ? 'left-6 bottom-6' : 'right-10 bottom-6'}
        w-14 h-14 bg-[#7C3AED] hover:bg-[#8b5cf6] active:scale-95 transition-all duration-200
      `}
      onClick={handleToggle}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.94 }}
      role="button"
      aria-label="Open Nexa chat"
      title={panelOpen && !minimized ? 'Close Nexa' : `Chat with ${nexaName}`}
    >
      <AnimatePresence mode="wait">
        {panelOpen && !minimized ? (
          <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={SPRING}>
            <X className="w-6 h-6 text-white" />
          </motion.div>
        ) : (
          <motion.div key="brain" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={SPRING}>
            <NexaIcon className="w-6 h-6 text-white" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );

  // ─── Chat Panel ─────────────────────────────────────────────
  const PANEL_RIGHT = isLeft ? 'left-6' : 'right-6';
  const PANEL_BOTTOM = 'bottom-24';
  const PANEL_LEFT = isLeft ? 'left-6' : 'auto';
  const PANEL_RIGHT_POS = isLeft ? 'auto' : 'right-6';

  const panel = (
    <AnimatePresence>
      {!minimized && (
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, y: 20, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.95 }}
          transition={SPRING}
          className={`
            fixed ${isLeft ? 'left-6 right-auto' : 'right-10'} ${PANEL_BOTTOM}
            z-[9998] w-80 max-w-[calc(100vw-3rem)]
            bg-[#1E293B]/95 backdrop-blur-xl border border-white/10
            rounded-2xl shadow-2xl flex flex-col overflow-hidden
          `}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#1E293B]/80 flex-shrink-0">
            <div className="flex items-center gap-3">
              {nexaAvatar ? (
                <img src={nexaAvatar} alt={nexaName} className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <NexaAvatar size="sm" />
              )}
              <div>
                <p className="text-sm font-semibold text-white">{nexaName}</p>
                <div className="flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-emerald-400" />
                  <span className="text-[10px] text-emerald-400">Ready</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleMinimize}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                title="Minimize"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                onClick={handleClose}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Message List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0 max-h-80 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center py-8 gap-3">
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <div className="w-14 h-14 bg-[#7C3AED]/20 rounded-2xl flex items-center justify-center">
                    <NexaIcon className="w-8 h-8 text-[#7C3AED]" />
                  </div>
                </motion.div>
                <div>
                  <p className="text-sm font-medium text-white/70">Hello! I'm {nexaName}</p>
                  <p className="text-xs text-white/40 mt-1">Ask me anything — or tap the mic to speak.</p>
                </div>
                {/* Quick prompts */}
                <div className="flex flex-wrap gap-2 justify-center mt-1">
                  {['Help me learn', 'What can you do?', 'Show my courses'].map(q => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      className="text-[11px] px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={SPRING}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-3 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#7C3AED] text-white rounded-tr-md'
                      : 'bg-white/10 text-white/90 rounded-tl-md'
                  }`}
                >
                  <p>{msg.text}</p>
                  {msg.role === 'nexa' && msg.usedLLM && (
                    <p className="text-[9px] text-white/25 mt-1 flex items-center gap-0.5">
                      <NexaIcon className="w-2.5 h-2.5" /> AI-powered
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-white/10 px-3 py-2.5 rounded-2xl rounded-tl-md flex items-center gap-1">
                  {[0, 150, 300].map(d => (
                    <span key={d} className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Speech error */}
          {speechError && (
            <div className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 mx-3 mb-1 rounded-lg flex items-center gap-2">
              <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
              <p className="text-[11px] text-red-300">{speechError}</p>
            </div>
          )}

          {/* Footer Input */}
          <div className="flex items-center gap-2 px-3 py-3 border-t border-white/10 bg-[#1E293B]/80 flex-shrink-0">
            {/* Mic button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={isListening ? stopListening : startListening}
              className={`
                w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors
                ${isListening
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-white/5 hover:bg-white/10 text-white/60 border border-white/10'}
              `}
              title={isListening ? 'Stop listening' : 'Speak to Nexa'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </motion.button>

            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask ${nexaName}…`}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] transition-shadow"
              disabled={sending}
            />
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={handleSend}
              disabled={sending || !inputValue.trim()}
              className="w-9 h-9 bg-[#7C3AED] hover:bg-[#8b5cf6] disabled:opacity-40 disabled:cursor-not-allowed rounded-xl flex items-center justify-center text-white transition-colors flex-shrink-0"
              title="Send message"
            >
              <Send className="w-4 h-4" />
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(
    <>
      {FAB}
      {panel}
    </>,
    document.body
  );
}
