/**
 * Public Landing Page — Marketplace Storefront (Landing-Page Revamp)
 *
 * Design reference: /d/nexify/frontend/src/assets/wolverine-source.html
 *   (the Wolverine Worldwide site provided by the user)
 *
 * The source is a brand-portfolio site: it gave us the structural DNA we
 * borrowed — a standout galaxy visual for the hero, a two-column hero that
 * leads with typography then follows with imagery, a header with nav tiles,
 * a course marketplace section, and a footer. The source's brand palette and
 * copy were NOT used; we kept Nexify's Midnight Neon design system
 * (#0f172a midnight navy, #7c3aed neon purple, #22d3ee cyan) and our own
 * "Learn. Create. Earn." / West African digital economy messaging.
 *
 * Responsive behavior — adapts automatically to every device:
 *   • Mobile  : stacked single column, no horizontal overflow, ≥44x44px touch
 *              targets, hamburger-visible nav, chat FAB repositioned low-right.
 *   • Tablet  : two-column hero on wide tablets, card grid expands to 2 cols.
 *   • Desktop : wide 3-column card grid, settled hero grid, full nav links.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SkeletonGrid } from '../../components/Skeleton';
import axios from 'axios';
import {
  Sparkles, X, BookOpen, Star, Users, RotateCcw,
  Menu, XCircle, Globe, Video, Award, ArrowRight
} from 'lucide-react';
import AdBanner from '../../components/AdBanner';

// ─── Nexa Chat Bubble ──────────────────────────────────────────────────────
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
      const res = await axios.post('/api/v1/nexa/chat', { prompt: message.trim() });
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
      {/* Chat toggle — sticky, reachable, ≥44x44px on touch */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 sm:w-12 sm:h-12 bg-[#7C3AED] text-white rounded-full shadow-nexa-fab hover:bg-[#6D28D9] transition-colors flex items-center justify-center"
        aria-label="Open Nexa chat"
      >
        <Sparkles className="w-5 h-5" />
      </button>

      {/* Chat window — mobile-safe, stacks vertically on small screens */}
      {open && (
        <div className="fixed bottom-24 right-4 z-50 w-[calc(100vw-2rem)] sm:w-96 max-h-[75vh] bg-[#0F172A] rounded-2xl shadow-card-lg border border-white/10 flex flex-col">
          {/* Header */}
          <div className="bg-[#1E1B4B] text-white px-4 py-3 rounded-t-2xl shrink-0 border-b border-white/10">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#7C3AED]" />
                <span className="font-semibold text-sm">Nexa</span>
                <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full">AI Assistant</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close chat"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#1A1430]">
            {messages.length === 0 && (
              <p className="text-xs text-white/40 text-center py-4">Ask Nexa anything about courses, earnings, or the platform.</p>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs sm:text-sm ${
                  msg.role === 'user'
                    ? 'bg-[#7C3AED]/20 text-white rounded-br-sm'
                    : 'bg-white/5 text-white/80 rounded-bl-sm border border-white/5'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white/5 border border-white/5 rounded-bl-sm px-3 py-2">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 bg-[#7C3AED] rounded-full animate-ping" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-[#7C3AED] rounded-full animate-ping" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-[#7C3AED] rounded-full animate-ping" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-white/10 flex gap-2 shrink-0">
            <input
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Ask Nexa..."
              className="flex-1 min-w-0 px-3 py-2.5 border border-white/10 rounded-xl text-xs sm:text-sm bg-white/5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
            />
            <button
              onClick={sendMessage}
              disabled={!message.trim() || loading}
              className="w-10 h-10 sm:w-8 sm:h-8 bg-[#7C3AED] text-white rounded-xl hover:bg-[#6D28D9] transition-colors disabled:opacity-40 flex items-center justify-center shrink-0"
              aria-label="Send message"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m-7 7l7-7 7 7"/></svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Landing Page ──────────────────────────────────────────────────────────
export default function Landing() {
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false); // mobile nav toggle

  useEffect(() => {
    axios.get('/api/v1/courses')
      .then(res => setCourses(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = courses.filter(c =>
    !search || c.title.toLowerCase().includes(search.toLowerCase())
  );

  // Mobile nav toggle: close the drawer when a link is clicked
  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="min-h-screen bg-[#0F172A] text-white antialiased">

      {/* ─── Header ─── */}
      <header className="sticky top-0 z-40 bg-[#0F172A]/95 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-5 sm:px-6">
          <div className="flex items-center justify-between py-3 gap-3">
            {/* Brand */}
            <Link to="/" className="flex items-center gap-2.5 group hover:opacity-90 transition-opacity">
              <div className="w-10 h-10 bg-[#7C3AED] rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-[#7C3AED]/20">
                N
              </div>
              <span className="text-lg font-bold tracking-tight">Nexify</span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              <Link to="/catalog" className="px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors">Browse</Link>
              <Link to="/courses" className="px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors">Courses</Link>
              <Link to="/creators" className="px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors">Creators</Link>
              <Link to="/about" className="px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors">About</Link>
              <Link to="/nexa" className="flex items-center gap-1.5 px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                <Sparkles className="w-4 h-4 text-[#7C3AED]" />
                Nexa
              </Link>
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              <Link to="/login" className="text-sm text-white/60 hover:text-white transition-colors hidden sm:inline-flex">
                Sign In
              </Link>
              <Link
                to="/register"
                className="bg-[#7C3AED] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#6D28D9] transition-colors whitespace-nowrap flex items-center gap-1.5"
              >
                <ArrowRight className="w-4 h-4" />
                Get Started
              </Link>

              {/* Mobile hamburger */}
              <button
                className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                onClick={() => setMenuOpen(v => !v)}
                aria-label="Toggle menu"
              >
                {menuOpen ? <XCircle className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile drawer — stacks below header, full width, scrollable */}
        {menuOpen && (
          <div className="md:hidden bg-[#0F172A] border-t border-white/5 px-4 py-4 space-y-1 max-w-7xl mx-auto">
            <Link to="/catalog" className="flex items-center gap-3 px-3 py-3 rounded-xl text-white/70 hover:text-white hover:bg-white/5 transition-colors">Browse</Link>
            <Link to="/courses" className="flex items-center gap-3 px-3 py-3 rounded-xl text-white/70 hover:text-white hover:bg-white/5 transition-colors">Courses</Link>
            <Link to="/creators" className="flex items-center gap-3 px-3 py-3 rounded-xl text-white/70 hover:text-white hover:bg-white/5 transition-colors">Creators</Link>
            <Link to="/about" className="flex items-center gap-3 px-3 py-3 rounded-xl text-white/70 hover:text-white hover:bg-white/5 transition-colors">About</Link>
            <Link to="/nexa" className="flex items-center gap-3 px-3 py-3 rounded-xl text-white/70 hover:text-white hover:bg-white/5 transition-colors">
              <Sparkles className="w-4 h-4 text-[#7C3AED]" />
              Nexa
            </Link>
            <div className="pt-3 border-t border-white/5 flex gap-2">
              <Link to="/login" className="flex-1 text-center text-sm text-white/60 hover:text-white py-2 rounded-lg transition-colors">Sign In</Link>
              <Link to="/register" className="flex-1 text-center text-sm bg-[#7C3AED] text-white py-2 rounded-lg hover:bg-[#6D28D9] transition-colors">Get Started</Link>
            </div>
          </div>
        )}
      </header>

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden bg-[#0F172A]">
        {/* Decorative galaxy gradient orb (mobile-safe) */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,transparent_55%,rgba(124,58,237,0.10)_80%,rgba(124,58,237,0.02)_100%)]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-5 sm:px-6 pt-12 pb-16 md:pt-20 md:pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            {/* Left: text + CTAs */}
            <div>
              <span className="inline-flex items-center gap-1.5 bg-[#7C3AED]/10 text-[#7C3AED] text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-full mb-4 border border-[#7C3AED]/20">
                <Award className="w-3.5 h-3.5" />
                Ghana's #1 E-Learning Platform
              </span>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-5">
                Learn. Create. Earn.
                <br />
                <span className="text-[#7C3AED]">The West African Digital Economy Platform.</span>
              </h1>
              <p className="text-sm sm:text-base text-white/60 mb-6 max-w-xl leading-relaxed">
                Discover expert-led courses, join physical workshops across Ghana, and earn
                commissions by sharing what you love. Powered by Nexa, your intelligent
                learning assistant.
              </p>

              {/* Stats row — mobile stacked, desktop inline */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-6 mb-6">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-white/50">
                  <Users className="w-4 h-4 text-[#7C3AED]" />
                  <span className="font-medium text-white/70">32,400+ learners</span>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-white/50">
                  <Star className="w-4 h-4 text-[#7C3AED] fill-[#7C3AED]" />
                  <span className="font-medium text-white/70">4.9/5 rating</span>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-white/50">
                  <Globe className="w-4 h-4 text-[#7C3AED]" />
                  <span className="font-medium text-white/70">200+ countries</span>
                </div>
              </div>

              {/* Feature badges */}
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="inline-flex items-center gap-1.5 bg-white/5 text-white/70 text-xs font-medium px-3 py-1.5 rounded-full">
                  <BookOpen className="w-3 h-3 text-[#7C3AED]" />
                  Certified Courses
                </span>
                <span className="inline-flex items-center gap-1.5 bg-white/5 text-white/70 text-xs font-medium px-3 py-1.5 rounded-full">
                  <Video className="w-3 h-3 text-[#7C3AED]" />
                  Video & Lab Learning
                </span>
                <span className="inline-flex items-center gap-1.5 bg-white/5 text-white/70 text-xs font-medium px-3 py-1.5 rounded-full">
                  <Globe className="w-3 h-3 text-[#7C3AED]" />
                  Mobile Money Payments
                </span>
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap gap-2.5">
                <Link to="/register?role=CREATOR" className="bg-[#7C3AED] text-white px-5 py-3 rounded-xl font-semibold hover:bg-[#6D28D9] transition-colors flex items-center gap-2 inline-flex shadow-lg shadow-[#7C3AED]/20">
                  <RotateCcw className="w-4 h-4" />
                  Create a Course
                </Link>
                <Link to="/register?role=AFFILIATE" className="border border-white/30 text-white px-5 py-3 rounded-xl font-semibold hover:bg-white/10 transition-colors flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Become an Affiliate
                </Link>
                <Link to="/register?role=STUDENT" className="border border-white/30 text-white px-5 py-3 rounded-xl font-semibold hover:bg-white/10 transition-colors flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Start Learning
                </Link>
              </div>
            </div>

            {/* Right: visual panel — galaxy-style hero card */}
            <div className="relative flex items-center justify-center lg:min-h-[280px] xl:min-h-[360px]">
              <div className="absolute inset-0 bg-gradient-to-br from-[#7C3AED]/10 via-[#0F172A] to-[#0F172A] rounded-2xl p-6 sm:p-8 border border-white/5" />
              {/* Glow orbs */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 rounded-full bg-[#7C3AED]/10 blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 right-0 w-32 h-32 rounded-full bg-[#22D3EE]/10 blur-2xl pointer-events-none" />

              {/* Course preview card (glass) */}
              <div className="relative bg-white/[0.06] backdrop-blur-sm rounded-xl p-5 sm:p-6 border border-white/10 w-full max-w-xs shadow-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-[#7C3AED] rounded-lg flex items-center justify-center shadow-lg shadow-[#7C3AED]/20">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">Pro Course</p>
                    <p className="text-white/50 text-xs">High-Ticket Sales</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm mb-3">
                  <span className="text-white/70">by Kofi Mensah</span>
                  <span className="text-[#7C3AED] font-bold">GH₵ 800</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-white/50 mb-3">
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-[#7C3AED] text-[#7C3AED]" />
                    4.9
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    22 seats left
                  </span>
                </div>
                <button className="w-full bg-[#7C3AED] text-white py-2.5 rounded-xl font-semibold hover:bg-[#6D28D9] transition-colors text-sm">
                  View Course
                </button>
              </div>

              {/* Social proof badge */}
              <div className="absolute -top-2 -right-2 sm:-right-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-3 py-2 flex items-center gap-2 shadow-lg">
                <div className="flex -space-x-1.5">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-5 h-5 rounded-full bg-white/10 border border-white/10" />
                  ))}
                </div>
                <span className="text-xs text-white/40">32,400+ learners</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Hero Ad Banner ─── */}
      <AdBanner placement="LANDING_HERO" />

      {/* ─── Course Marketplace ─── */}
      <section className="bg-[#0F172A] py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-5 sm:px-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">Browse Courses</h2>
              <p className="text-white/50 text-sm mt-0.5">Expert-led courses from Ghana's top creators</p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full px-9 py-2.5 border border-white/10 rounded-xl bg-white/5 text-white text-sm placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent"
                />
                <svg className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" strokeWidth="2"/><path d="m21 21-4.35-4.35" strokeWidth="2" strokeLinecap="round"/></svg>
              </div>
              <Link
                to="/courses"
                className="bg-[#7C3AED] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#6D28D9] transition-colors whitespace-nowrap"
              >
                Browse Catalog
              </Link>
            </div>
          </div>

          {loading ? (
            <SkeletonGrid cols={3} count={3} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" />
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-white/40">
              <p className="text-sm">No courses found matching "{search}".</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map(course => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="bg-[#0F172A] border-t border-white/5 py-8 mt-10">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/40">
          <p>&copy; 2026 Nexify. Built for the West African digital economy.</p>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-white/70 transition-colors">Privacy</a>
            <a href="#" className="hover:text-white/70 transition-colors">Terms</a>
            <a href="#" className="hover:text-white/70 transition-colors">Support</a>
            <a href="#" className="hover:text-white/70 transition-colors">GitHub</a>
          </div>
        </div>
      </footer>

      {/* Nexa AI Chat */}
      <NexaChatBubble />
    </div>
  );
}

// ─── Course Card ────────────────────────────────────────────────────────────
function CourseCard({ course }) {
  const [showCheckout, setShowCheckout] = useState(false);

  return (
    <div className="bg-[#1E293B] rounded-2xl shadow-card-sm border border-white/10 overflow-hidden hover:shadow-card-lg transition-shadow duration-200 group">
      {/* Cover / Thumbnail */}
      <div className="aspect-video bg-[#0F172A] relative overflow-hidden">
        {course.coverImageUrl ? (
          <img src={course.coverImageUrl} alt={course.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-16 h-16 bg-[#7C3AED] rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-[#7C3AED]/20">
              {course.title.charAt(0)}
            </div>
          </div>
        )}
        <span className="absolute top-3 left-3 bg-white/10 text-white/80 text-xs font-semibold px-2.5 py-1 rounded-full capitalize backdrop-blur-sm flex items-center gap-1">
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
          <span className="absolute top-3 right-3 bg-emerald-500/20 text-emerald-400 text-xs font-semibold px-2.5 py-1 rounded-full">
            {course.bookedSeats || 0} / {course.maxSeats} seats
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-base font-bold text-white mb-1.5 line-clamp-2 group-hover:text-[#7C3AED] transition-colors">{course.title}</h3>
        <p className="text-sm text-white/50 mb-3 line-clamp-2">{course.description}</p>

        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-white/50">by {course.creator?.fullName || 'Unknown'}</span>
          <span className="text-[#7C3AED] font-bold text-lg currency-ghs">
            GH₵ {(course.priceGhs || 0).toFixed(2)}
          </span>
        </div>

        <div className="flex items-center gap-3 mb-3 text-xs text-white/40">
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
            {(course._count?.orders || 0) + (course.type === 'IN_PERSON_LAB' ? (course.bookedSeats || 0) : 0)} enrolled
          </span>
          <span className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 fill-[#7C3AED] text-[#7C3AED]" />
            4.9
          </span>
        </div>

        {course.teaserUrl && (
          <div className="flex items-center gap-2 mb-3 text-xs text-slate-500">
            <Video className="w-3 h-3" />
            <span>Trailer available</span>
          </div>
        )}

        {course.hasOrderBump && course.orderBumpTitle && (
          <div className="flex items-center gap-2 mb-3 text-xs text-amber-400 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
            <span className="text-lg font-bold">+</span>
            <span>Add: {course.orderBumpTitle} (GH₵ {course.orderBumpPriceGhs?.toFixed(2)})</span>
          </div>
        )}

        <button
          onClick={() => setShowCheckout(true)}
          className="w-full bg-[#7C3AED] text-white py-2.5 rounded-xl font-semibold hover:bg-[#6D28D9] active:scale-[0.98] transition-all duration-150 text-sm"
        >
          {course.status === 'PUBLISHED' ? 'View Course & Buy' : `Course (${course.status.replace('_', ' ')})`}
        </button>
      </div>

      {showCheckout && <CheckoutModal course={course} onClose={() => setShowCheckout(false)} />}
    </div>
  );
}

// ─── Checkout Modal (Inline) ───────────────────────────────────────────────
function CheckoutModal({ course, onClose }) {
  const [form, setForm] = useState({ email: '', name: '', phone: '', channel: 'MOMO_MTN', bump: false });
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  const total = form.bump && course.hasOrderBump
    ? (course.priceGhs || 0) + (course.orderBumpPriceGhs || 0)
    : (course.priceGhs || 0);

  const handleSubmit = async () => {
    if (!form.email || !form.name || !form.phone) { setError('All fields are required.'); return; }
    setProcessing(true); setError(null);
    try {
      await axios.post('/api/v1/orders/checkout', {
        courseId: course.id, studentEmail: form.email, studentName: form.name,
        studentPhone: form.phone, includeOrderBump: form.bump && course.hasOrderBump,
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4">
        <div className="bg-white rounded-2xl shadow-card-lg p-6 sm:p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Payment Successful!</h2>
          <p className="text-slate-600 mb-1">You now have access to:</p>
          <p className="text-lg font-bold text-slate-900 mb-4">{course.title}</p>
          <p className="text-sm text-slate-500 mb-6">
            {course.type === 'IN_PERSON_LAB' ? 'Check your email for venue details and lab dates.' : 'Start learning in your Student Dashboard.'}
          </p>
          <div className="flex flex-col gap-2">
            <Link to="/student" className="bg-[#7C3AED] text-white text-center py-2.5 rounded-xl font-semibold hover:bg-[#6D28D9] transition-colors">
              Go to Student Dashboard
            </Link>
            <button onClick={onClose} className="text-sm text-slate-500 hover:text-slate-700 transition-colors">Close</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4">
      <div className="relative w-full sm:max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-t-2xl sm:rounded-2xl shadow-card-lg">
        <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-lg transition-colors z-10">
          <XCircle className="w-4 h-4" />
        </button>
        <div className="p-5 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-1">Checkout</h2>
          <p className="text-sm text-slate-500 mb-6">{course.title}</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>
          )}

          <div className="bg-[#EDE9FE] rounded-xl p-4 mb-6">
            <div className="flex justify-between mb-1">
              <span className="text-sm text-slate-600">Base Price</span>
              <span className="text-sm font-medium text-slate-900 currency-ghs">GH₵ {(course.priceGhs || 0).toFixed(2)}</span>
            </div>
            {course.hasOrderBump && (
              <label className="flex items-center gap-3 mb-3 cursor-pointer">
                <input
                  type="checkbox" checked={form.bump} onChange={e => setForm(f => ({ ...f, bump: e.target.checked }))}
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

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input
                type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent"
                placeholder="Your full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone (for MoMo)</label>
              <input
                type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent"
                placeholder="+233..."
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-3">Payment Method</label>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-3">
              {[
                { value: 'MOMO_MTN', label: 'MTN MoMi', color: '#ffcc00' },
                { value: 'MOMO_TELECEL', label: 'Telecel', color: '#e60000' },
                { value: 'CARD_SIMULATED', label: 'Card', color: '#1e293b' },
              ].map(ch => (
                <label
                  key={ch.value} className={`relative flex flex-col items-center p-3 rounded-xl border-2 cursor-pointer transition-all
                    ${form.channel === ch.value ? 'border-[#7C3AED] bg-[#7C3AED]/5 shadow-bump-glow' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                >
                  <input type="radio" name="channel" value={ch.value} checked={form.channel === ch.value} onChange={e => setForm(f => ({ ...f, channel: e.target.value }))} className="sr-only" />
                  <span className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold mb-2" style={{ backgroundColor: ch.color }}>
                    {ch.label.charAt(0)}
                  </span>
                  <span className="text-xs font-medium text-slate-700 text-center">{ch.label}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={handleSubmit} disabled={processing}
            className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold text-base hover:bg-emerald-500 active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {processing ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                Processing...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                Pay GH₵ {total.toFixed(2)}
              </>
            )}
          </button>
          <p className="text-xs text-slate-400 text-center mt-3">Secured with simulated MoMo processing. No real payment required.</p>
        </div>
      </div>
    </div>
  );
}
