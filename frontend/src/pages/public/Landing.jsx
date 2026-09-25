/**
 * Public Landing Page — Marketplace Storefront
 *
 * The entry point before authentication: marketing-facing course discovery,
 * trailer previews, and role-appropriate sign-up/login routing.
 *
 * This gateway does NOT share layout/navigation chrome with any
 * authenticated portal — it is its own visual surface.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SkeletonGrid } from '../../components/Skeleton';
import axios from 'axios';
import { X, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import NexaIcon from '../../components/common/NexaIcon';
import AdBanner from '../../components/AdBanner';

// ─── Nexa Chat Bubble Component ──────────────────────────────
function NexaChatBubble() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!message.trim() || loading) return;
    setMessages(prev => [...prev, { role: 'user', text: message.trim() }]);
    setLoading(true);
    try {
      const res = await axios.post('/api/v1/nexa-chat/chat', { prompt: message.trim() });
      setMessages(prev => [...prev, { role: 'nexa', text: res.data.data.response || 'No response.' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'nexa', text: 'Nexa is unavailable right now.' }]);
    } finally {
      setLoading(false);
      setMessage('');
    }
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-gradient-to-br from-purple-600 to-purple-800 text-white rounded-2xl shadow-xl shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-105 transition-all duration-300 flex items-center justify-center group"
        aria-label="Open Nexa chat"
      >
        <NexaIcon className="w-6 h-6 text-white" />
        <span className="absolute right-full mr-3 text-xs text-white/50 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Ask Nexa</span>
      </button>

      {/* Chat Window */}
      {open && (
        <div className="fixed bottom-20 right-6 z-50 w-96 bg-[#1E1B4B]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-purple-900/30 flex flex-col max-h-[70vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600/20 to-purple-800/20 backdrop-blur text-white px-4 py-3 rounded-t-2xl flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-2">
              <NexaIcon className="w-4 h-4 text-purple-400" />
              <span className="font-semibold text-sm">Nexa</span>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">AI</span>
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            </div>
            <button onClick={() => setOpen(false)} className="text-white/40 hover:text-white transition-colors p-0.5 rounded-lg hover:bg-white/5">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0F172A]/50">
            {messages.length === 0 && (
              <p className="text-sm text-white/40 text-center">Ask Nexa anything about courses, earnings, or the platform.</p>
            )}
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-br-sm shadow-lg shadow-purple-500/20'
                    : 'bg-white/10 text-white/90 rounded-bl-sm border border-white/5'
                }`}>
                  {msg.text}
                </div>
              </motion.div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white/10 border border-white/5 rounded-bl-sm px-3 py-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-white/10 flex gap-2">
            <input
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Ask Nexa..."
              className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/30"
            />
            <button
              onClick={sendMessage}
              disabled={!message.trim() || loading}
              className="w-9 h-9 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl hover:from-purple-500 hover:to-purple-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shadow-lg shadow-purple-500/20"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m-7 7l7-7 7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default function Landing() {
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/v1/courses')
      .then(res => setCourses(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = courses.filter(c =>
    !search || c.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen">
      {/* ─── Header ─── */}
      <header className="bg-[#0F172A] text-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <div className="w-10 h-10 bg-[#7C3AED] rounded-lg flex items-center justify-center text-white font-bold text-lg">
              N
            </div>
            <span className="text-xl font-bold tracking-tight">Nexify</span>
          </Link>
          <div className="flex-1 max-w-lg mx-8 hidden md:block">
            <div className="relative">
              <input
                type="text"
                placeholder="Search courses..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-nexify text-white text-sm placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent"
              />
              <svg className="absolute left-3 top-2.5 w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" strokeWidth="2" />
                <path d="m21 21-4.35-4.35" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          </div>
          <nav className="flex items-center gap-4">
            <Link to="/nexa" className="flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors">
              <NexaIcon className="w-4 h-4 text-[#7C3AED]" />
              Nexa
            </Link>
            <Link to="/login" className="text-sm text-white/70 hover:text-white transition-colors">Sign In</Link>
            <Link to="/register" className="text-sm bg-[#7C3AED] text-white px-4 py-2 rounded-nexify hover:bg-[#6D28D9] transition-colors inline-flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* ─── Hero ─── */}
      <section className="bg-[#0F172A] text-white">
        <div className="max-w-7xl mx-auto px-6 py-16 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text & CTAs */}
            <div>
              <span className="inline-block bg-[#7C3AED]/20 text-[#7C3AED] text-sm font-semibold px-3 py-1 rounded-full mb-4">
                Ghana's #1 E-Learning Platform
              </span>
              <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                Learn. Create. Earn.
                <br />
                <span className="text-[#7C3AED]">The West African Digital Economy Platform.</span>
              </h1>
              <p className="text-lg text-white/70 mb-6 max-w-xl">
                Discover expert-led courses, join physical workshops across Ghana, and earn commissions
                by sharing what you love. Powered by Nexa, your intelligent learning assistant.
              </p>

              {/* Stats row */}
              <div className="flex items-center gap-6 mb-6">
                <div className="flex items-center gap-2 text-sm text-white/60">
                  <svg className="w-5 h-5 text-[#7C3AED]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  <span>Sample data: 32,400+ learners</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-white/60">
                  <svg className="w-5 h-5 text-[#7C3AED]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                  <span>Sample data: 4.9/5 average rating</span>
                </div>
              </div>

              {/* Feature badges */}
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="inline-flex items-center gap-1.5 bg-white/10 text-white/80 text-xs font-medium px-3 py-1 rounded-full">
                  <svg className="w-3.5 h-3.5 text-[#7C3AED]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.24 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.759 18 7.5 18s3.332.477 4.5 1.253m0-13C13.832 5.477 15.423 5 17.144 5c1.722 0 3.314.477 4.936 1.253v13C21.314 18.477 19.724 18 18.144 18c-1.581 0-3.172.477-4.754 1.253"/></svg>
                  Certified Courses
                </span>
                <span className="inline-flex items-center gap-1.5 bg-white/10 text-white/80 text-xs font-medium px-3 py-1 rounded-full">
                  <svg className="w-3.5 h-3.5 text-[#7C3AED]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-16 0H3"/><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 7H3m6 0H3m6 0H9m6 0h2m-6 0H3"/></svg>
                  Physical Labs in Accra &amp; Kumasi
                </span>
                <span className="inline-flex items-center gap-1.5 bg-white/10 text-white/80 text-xs font-medium px-3 py-1 rounded-full">
                  <svg className="w-3.5 h-3.5 text-[#7C3AED]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                  Mobile Money Payments
                </span>
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap gap-3">
                <Link to="/register?role=CREATOR" className="bg-[#7C3AED] text-white px-6 py-3 rounded-nexify font-semibold hover:bg-[#6D28D9] transition-colors inline-flex items-center gap-2 shadow-lg shadow-[#7C3AED]/20">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
                  Create a Course
                </Link>
                <Link to="/register?role=AFFILIATE" className="border border-white/30 text-white px-6 py-3 rounded-nexify font-semibold hover:bg-white/10 transition-colors inline-flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M18 17.5c-3.388-1.24-10.628-5.56-13.5-6.5C4.56 5.5 5.658 2 9 2c3.342 0 6.422 2.209 9.25 4.25C19.564 7.2 22 12 22 17.5z"/></svg>
                  Become an Affiliate
                </Link>
                <Link to="/register?role=STUDENT" className="border border-white/30 text-white px-6 py-3 rounded-nexify font-semibold hover:bg-white/10 transition-colors inline-flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.24 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.759 18 7.5 18s3.332.477 4.5 1.253m0-13C13.832 5.477 15.423 5 17.144 5c1.722 0 3.314.477 4.936 1.253v13C21.314 18.477 19.724 18 18.144 18c-1.581 0-3.172.477-4.754 1.253"/></svg>
                  Start Learning
                </Link>
              </div>
            </div>

            {/* Right: Visual panel */}
            <div className="relative">
              <div className="bg-gradient-to-br from-[#7C3AED]/10 via-[#0F172A] to-[#0F172A] rounded-2xl p-8 min-h-[320px] md:min-h-[360px] flex items-center justify-center border border-white/5">
              <div className="relative w-full h-full">
                <div className="absolute top-1/2 right-1/4 w-56 h-56 rounded-full bg-[#7C3AED]/20 blur-3xl" />
                  {/* Course preview card */}
                  <div className="bg-white/[0.07] backdrop-blur-sm rounded-xl p-6 border border-white/10 w-full max-w-xs">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-[#7C3AED] rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.24 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.759 18 7.5 18s3.332.477 4.5 1.253m0-13C13.832 5.477 15.423 5 17.144 5c1.722 0 3.314.477 4.936 1.253v13C21.314 18.477 19.724 18 18.144 18c-1.581 0-3.172.477-4.754 1.253"/></svg>
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">Pro Course</p>
                        <p className="text-white/50 text-xs">High-Ticket Sales</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/70">by Kofi Mensah</span>
                      <span className="text-[#7C3AED] font-bold">GH₵ 800</span>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-xs text-white/50">
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                        4.9
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                        22/30 seats
                      </span>
                    </div>
                  </div>
                  {/* Social proof — learner group */}
                  <div className="absolute bottom-8 left-8">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-9 h-9 bg-[#7C3AED]/20 border border-[#7C3AED]/30 rounded-full">
                        <svg className="w-5 h-5 text-[#7C3AED]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"/></svg>
                      </div>
                    </div>
                    <p className="text-white/40 text-xs mt-2">Sample data: 32,400+ learners</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Hero Ad Banner ─── */}
      <AdBanner placement="LANDING_HERO" />

      {/* ─── Course Marketplace ─── */}
      <section className="bg-[#0F172A] py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white">Browse Courses</h2>
              <p className="text-white/50 text-sm mt-1">Expert-led courses from Ghana's top creators</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-full md:w-64">
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-white/10 rounded-nexify bg-white/5 text-white text-sm placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent"
                />
                <svg className="absolute left-3 top-3 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" strokeWidth="2" />
                  <path d="m21 21-4.35-4.35" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <Link
                to="/courses"
                className="bg-[#7C3AED] text-white text-sm font-semibold px-4 py-2.5 rounded-nexify hover:bg-[#6D28D9] transition-colors whitespace-nowrap"
              >
                Browse Catalog
              </Link>
            </div>
          </div>

        {loading ? (
          <SkeletonGrid cols={3} count={3} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" />
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-white/40">
            <p>No courses found matching "{search}".</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </div>
    </section>

      {/* ─── Footer Banner Ad ─── */}
      <AdBanner placement="FOOTER" />

      {/* ─── Footer ─── */}
      <footer className="bg-[#0F172A] text-white/70 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm">
          <p>&copy; 2026 Nexify. Built for the West African digital economy.</p>
        </div>
      </footer>

      {/* Nexa AI Chat */}
      <NexaChatBubble />
    </div>
  );
}

// ─── Course Card Component ──────────────────────────────────
function CourseCard({ course }) {
  const [showCheckout, setShowCheckout] = useState(false);

  return (
    <div className="bg-[#1E293B] rounded-nexify shadow-card-sm border border-white/10 overflow-hidden hover:shadow-card-lg transition-shadow duration-200">
      {/* Cover / Thumbnail */}
      <div className="aspect-video bg-[#0F172A] relative">
        {course.coverImageUrl ? (
          <img src={course.coverImageUrl} alt={course.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-16 h-16 bg-[#7C3AED] rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {course.title.charAt(0)}
            </div>
          </div>
        )}
        <span className="absolute top-3 left-3 bg-white/10 text-white/80 text-xs font-semibold px-2 py-1 rounded-full capitalize backdrop-blur-sm flex items-center gap-1">
                  {course.type === 'IN_PERSON_LAB' ? (
                    <>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"/></svg>
                      In-Person
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                      Digital
                    </>
                  )}
                </span>
        {course.type === 'IN_PERSON_LAB' && course.maxSeats && (
          <span className="absolute top-3 right-3 bg-emerald-500/20 text-emerald-400 text-xs font-semibold px-2 py-1 rounded-full">
            {course.bookedSeats || 0} / {course.maxSeats} seats
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-lg font-bold text-white mb-1 line-clamp-2">{course.title}</h3>
        <p className="text-sm text-white/50 mb-3 line-clamp-2">{course.description}</p>

        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-white/50">by {course.creator?.fullName || 'Unknown'}</span>
          <span className="text-[#7C3AED] font-bold text-lg currency-ghs">
            GH₵ {(course.priceGhs || 0).toFixed(2)}
          </span>
        </div>

        {/* Social proof: students + rating */}
        <div className="flex items-center gap-4 mb-3 text-xs text-white/40">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
            {(course._count?.orders || 0) + (course.type === 'IN_PERSON_LAB' ? (course.bookedSeats || 0) : 0)} enrolled
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4 text-[#7C3AED]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            4.9
          </span>
        </div>

        {/* Trailer preview badge */}
        {course.teaserUrl && (
          <div className="flex items-center gap-2 mb-3 text-xs text-slate-500">
            <span className="inline-block w-2 h-2 rounded-full bg-[#7C3AED]" />
            <span>30-90s trailer available</span>
          </div>
        )}

        {/* Order Bump indicator */}
        {course.hasOrderBump && course.orderBumpTitle && (
          <div className="flex items-center gap-2 mb-3 text-xs text-amber-400 bg-amber-500/10 p-2 rounded-nexify border border-amber-500/20">
            <span className="text-lg">+</span>
            <span>Add: {course.orderBumpTitle} (GH₵ {course.orderBumpPriceGhs?.toFixed(2)})</span>
          </div>
        )}

        {/* CTA */}
        <button
          onClick={() => setShowCheckout(true)}
          className="w-full bg-[#7C3AED] text-white py-2.5 rounded-nexify font-semibold hover:bg-[#6D28D9] active:scale-[0.98] transition-all duration-150"
        >
          {course.status === 'PUBLISHED' ? 'View Course & Buy' : `Course (${course.status.replace('_', ' ')})`}
        </button>
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <CheckoutModal course={course} onClose={() => setShowCheckout(false)} />
      )}
    </div>
  );
}

// ─── Checkout Modal (Inline) ────────────────────────────────
function CheckoutModal({ course, onClose }) {
  const [form, setForm] = useState({ email: '', name: '', phone: '', channel: 'MOMO_MTN', bump: false });
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  const total = form.bump && course.hasOrderBump ? (course.priceGhs || 0) + (course.orderBumpPriceGhs || 0) : (course.priceGhs || 0);

  const handleSubmit = async () => {
    if (!form.email || !form.name || !form.phone) {
      setError('All fields are required.');
      return;
    }
    setProcessing(true);
    setError(null);
    try {
      const res = await axios.post('/api/v1/orders/checkout', {
        courseId: course.id,
        studentEmail: form.email,
        studentName: form.name,
        studentPhone: form.phone,
        includeOrderBump: form.bump && course.hasOrderBump,
        paymentChannel: form.channel,
      });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Checkout failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (done) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-card-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Payment Successful!</h2>
          <p className="text-slate-600 mb-1">You now have access to:</p>
          <p className="text-lg font-bold text-slate-900 mb-4">{course.title}</p>
          <p className="text-sm text-slate-500 mb-6">
            {course.type === 'IN_PERSON_LAB' ? 'Check your email for venue details and lab dates.' : 'Start learning in your Student Dashboard.'}
          </p>
          <div className="flex flex-col gap-2">
            <Link to="/student" className="bg-[#7C3AED] text-white text-center py-2.5 rounded-nexify font-semibold hover:bg-[#6D28D9] transition-colors">
              Go to Student Dashboard
            </Link>
            <button onClick={onClose} className="text-sm text-slate-500 hover:text-slate-700 transition-colors">
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="relative w-full sm:max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-t-2xl sm:rounded-2xl shadow-card-lg">
        {/* Close button */}
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-lg transition-colors z-10">
          &times;
        </button>

        <div className="p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-1">Checkout</h2>
          <p className="text-sm text-slate-500 mb-6">{course.title}</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-nexify mb-4">
              {error}
            </div>
          )}

          {/* Course summary */}
          <div className="bg-[#EDE9FE] rounded-nexify p-4 mb-6">
            <div className="flex justify-between mb-1">
              <span className="text-sm text-slate-600">Base Price</span>
              <span className="text-sm font-medium text-slate-900 currency-ghs">GH₵ {(course.priceGhs || 0).toFixed(2)}</span>
            </div>
            {course.hasOrderBump && (
              <label className="flex items-center gap-3 mb-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.bump}
                  onChange={e => setForm(f => ({ ...f, bump: e.target.checked }))}
                  className="w-4 h-4 rounded border-slate-300 text-[#7C3AED] focus:ring-[#7C3AED] cursor-pointer"
                />
                <div>
                  <span className="text-sm font-medium text-slate-900">{course.orderBumpTitle}</span>
                  <span className="text-sm text-slate-500 block">+ GH₵ {course.orderBumpPriceGhs?.toFixed(2)}</span>
                </div>
              </label>
            )}
            <div className="border-t border-slate-200 pt-3 mt-2 flex justify-between">
              <span className="font-bold text-slate-900">Total</span>
              <span className="font-bold text-[#7C3AED] text-lg currency-ghs">GH₵ {total.toFixed(2)}</span>
            </div>
          </div>

          {/* Contact form */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-nexify text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent"
                placeholder="Your full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-nexify text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone (for MoMo)</label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-nexify text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent"
                placeholder="+233..."
              />
            </div>
          </div>

          {/* Payment selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-3">Payment Method</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'MOMO_MTN', label: 'MTN MoMo', color: '#ffcc00' },
                { value: 'MOMO_TELECEL', label: 'Telecel', color: '#e60000' },
                { value: 'CARD_SIMULATED', label: 'Card', color: '#1e293b' },
              ].map(ch => (
                <label
                  key={ch.value}
                  className={`relative flex flex-col items-center p-3 rounded-nexify border-2 cursor-pointer transition-all
                    ${form.channel === ch.value
                      ? 'border-[#7C3AED] bg-[#7C3AED]/5 shadow-bump-glow'
                      : 'border-slate-200 bg-white hover:border-slate-300'}`}
                >
                  <input
                    type="radio"
                    name="channel"
                    value={ch.value}
                    checked={form.channel === ch.value}
                    onChange={e => setForm(f => ({ ...f, channel: e.target.value }))}
                    className="sr-only"
                  />
                  <span className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold mb-2" style={{ backgroundColor: ch.color }}>
                    {ch.label.charAt(0)}
                  </span>
                  <span className="text-xs font-medium text-slate-700 text-center">{ch.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={processing}
            className="w-full bg-emerald-600 text-white py-3 rounded-nexify font-bold text-base hover:bg-emerald-500 active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {processing ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Processing...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Pay GH₵ {total.toFixed(2)}
              </>
            )}
          </button>

          <p className="text-xs text-slate-400 text-center mt-3">
            Secured with simulated MoMo processing. No real payment required.
          </p>
        </div>
        </div>
      </div>
    );
  }

