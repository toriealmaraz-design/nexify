/**
 * Creator Dashboard — Portal Shell
 * Course builder, workshop logistics, promo assets, revenue dashboard, Nexa analytics.
 *
 * Design: Grodital dark theme (deep black + gold accents)
 * Reference: PRD 6.3, SRS Persona B
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DollarSign, BookOpen, Users, Clock, Layout } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SkeletonStats, SkeletonRow } from '../../components/Skeleton';
import axios from 'axios';

function getToken() {
  return localStorage.getItem('nexify_token');
}

function api() {
  return axios.create({
    baseURL: '/api/v1',
    headers: { Authorization: `Bearer ${getToken()}` },
  });
}

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-[#1E1B4B] border border-white/10 rounded-xl p-4 hover:border-white/20 transition-colors">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-white/60"><Icon className="w-5 h-5" /></span>
        <span className="text-xs font-medium text-white/40 uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-xl font-bold text-white ${color}`}>{value}</p>
    </div>
  );
}

export default function CreatorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nexaMessages, setNexaMessages] = useState([]);

  useEffect(() => {
    api().get('/courses/stats/creator')
      .then(res => setCourses(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Nexa analytics ask
  const sendAnalyticsAsk = useCallback(async (text) => {
    if (!text?.trim()) return;
    setNexaMessages(prev => [...prev, { role: 'user', text: text }]);
    try {
      const res = await api().post('/nexa/chat', { prompt: text, role: 'CREATOR' });
      const reply = res.data?.data?.reply || res.data?.message || "Nexa is thinking...";
      setNexaMessages(prev => [...prev, { role: 'nexa', text: reply }]);
    } catch {
      setNexaMessages(prev => [...prev, { role: 'nexa', text: "Sorry, Nexa is unavailable right now." }]);
    }
  }, []);

  return (
    <div className="max-w-6xl">
      {/* Page header */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Creator Studio</h1>
          <p className="text-white/40 text-sm mt-1">Build courses. Manage workshops. Grow your brand.</p>
        </div>
        <span className="text-xs bg-[#7C3AED]/20 text-[#7C3AED] font-medium px-2 py-1 rounded-full">
          {user?.role}
        </span>
      </div>

      {/* Creator sub-nav */}
      <div className="flex items-center gap-1 mb-6 p-1 bg-[#1E1B4B]/50 border border-white/10 rounded-xl w-fit">
        <Link
          to="/creator"
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-white/40 hover:text-white hover:bg-white/10 transition-all duration-150"
        >
          <Layout className="w-4 h-4" />
          Overview
        </Link>
        <Link
          to="/creator/earnings"
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-[#7C3AED] text-black font-medium transition-all duration-150"
        >
          <DollarSign className="w-4 h-4" />
          Earnings
        </Link>
      </div>

      {/* Stats row */}
      {loading ? (
        <SkeletonStats />
      ) : (
        <div data-tour="creator-stats-row" className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Revenue" value="GH₵ 0.00" icon={DollarSign} color="text-emerald-400" />
          <StatCard label="Courses Published" value="0" icon={BookOpen} color="text-[#7C3AED]" />
          <StatCard label="Total Students" value="0" icon={Users} color="text-blue-400" />
          <StatCard label="Pending Payouts" value="GH₵ 0.00" icon={Clock} color="text-amber-400" />
        </div>
      )}

      {/* Course Builder CTA */}
      <div data-tour="creator-course-builder-cta" className="bg-[#1E1B4B] border border-white/10 text-white rounded-2xl p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold mb-1">Create Your First Course</h2>
            <p className="text-sm text-white/50">Build a course with modules, lessons, and a 30-90 second trailer.</p>
          </div>
          <button onClick={() => navigate('/creator/course/new')} className="bg-[#7C3AED] text-black px-5 py-2.5 rounded-xl font-semibold hover:brightness-110 active:scale-[0.98] transition-all duration-150 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Course
          </button>
        </div>
      </div>

      {/* My Courses */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">My Courses</h2>
          <button onClick={() => navigate('/creator/course/new')} className="text-sm text-[#7C3AED] font-medium hover:underline">+ Add New</button>
        </div>
        {loading ? (
          <SkeletonRow count={3} />
        ) : courses.length === 0 ? (
          <div className="bg-[#1E1B4B] border border-white/10 rounded-xl p-8 text-center">
            <div className="mb-3 flex justify-center">
              <svg className="w-10 h-10 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/></svg>
            </div>
            <h3 className="text-base font-semibold text-white mb-1">No courses yet</h3>
            <p className="text-sm text-white/40 mb-4">Create your first course to start earning.</p>
            <button onClick={() => navigate('/creator/course/new')} className="bg-[#7C3AED] text-black px-4 py-2 rounded-xl text-sm font-semibold hover:brightness-110 active:scale-[0.98] transition-all duration-150">
              Create Course
            </button>
          </div>
        ) : (
          <div data-tour="creator-course-list" className="space-y-3">
            {courses.map(course => (
              <div key={course.id} className="bg-[#1E1B4B] border border-white/10 rounded-xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:border-white/20 transition-colors">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full
                      ${course.status === 'PUBLISHED' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : course.status === 'PENDING_APPROVAL' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 animate-pulse'
                        : 'bg-white/10 text-white/40 border-white/10'}`}>
                      {course.status.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-white/30 capitalize flex items-center gap-1">
                      {course.type === 'IN_PERSON_LAB' ? (
                        <>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"/></svg>
                          Lab
                        </>
                      ) : (
                        <>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                          Digital
                        </>
                      )}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-1">{course.title}</h3>
                  <p className="text-sm text-white/40 mt-1">
                    GH₵ {(course.priceGhs || 0).toFixed(2)} ·{' '}
                    {course.type === 'IN_PERSON_LAB' && course.maxSeats
                      ? `${course.bookedSeats || 0}/${course.maxSeats} seats`
                      : `${course._count?.orders || 0} students`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => navigate(`/creator/course/${course.id}/edit`)} className="text-sm border border-white/10 text-white/60 px-3 py-1.5 rounded-xl hover:bg-white/5 transition-colors">
                    Edit
                  </button>
                  <button onClick={() => navigate(`/creator/course/${course.id}/stats`)} className="text-sm border border-white/10 text-white/60 px-3 py-1.5 rounded-xl hover:bg-white/5 transition-colors">
                    Stats
                  </button>
                  <button onClick={() => course.status === 'PUBLISHED' ? navigate(`/course/${course.id}`) : navigate(`/creator/course/${course.id}/edit`)} className="text-sm bg-[#7C3AED] text-black px-3 py-1.5 rounded-xl hover:brightness-110 active:scale-[0.98] transition-all duration-150 font-medium">
                    {course.status === 'PUBLISHED' ? 'Preview' : 'Submit'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Workshop Logistics */}
      <section className="bg-[#1E1B4B] border border-white/10 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-bold text-white mb-2">Workshop Logistics</h2>
        <p className="text-sm text-white/40 mb-4">Manage deposits, balances, waitlists, and venue capacity.</p>
        <div className="text-center py-4 text-white/30">
          <p className="text-xs">Connect API for live workshop data</p>
        </div>
      </section>

      {/* Promo Asset Manager */}
      <section data-tour="creator-assets-upload" className="bg-[#1E1B4B] border border-white/10 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-bold text-white mb-2">Promo Asset Manager</h2>
        <p className="text-sm text-white/40 mb-4">Upload WhatsApp scripts, TikTok hooks, and email templates.</p>
        <div className="flex gap-2">
          <button onClick={() => document.getElementById('swipe-upload').click()} className="bg-[#7C3AED] text-black px-4 py-2 rounded-xl text-sm font-semibold hover:brightness-110 active:scale-[0.98] transition-all duration-150">
            + Upload Swipe Asset
          </button>
          <input id="swipe-upload" type="file" multiple accept=".pdf,.doc,.docx,.txt,.mp4,.mov" className="hidden" onChange={e => { /* TODO: upload handler */ }} />
          <button onClick={() => navigate('/creator/assets')} className="border border-white/10 text-white/60 px-4 py-2 rounded-xl text-sm hover:bg-white/5 transition-colors">
            View Assets
          </button>
        </div>
      </section>

      {/* Nexa Analytics Panel */}
      <section className="bg-[#1E1B4B] border border-white/10 text-white rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#7C3AED] rounded-full flex items-center justify-center text-black text-sm font-bold">
              N
            </div>
            <h2 className="text-lg font-bold">Nexa Analytics</h2>
          </div>
          <span className="text-xs bg-white/10 text-white/70 px-2 py-1 rounded-full">CREATOR SCOPE</span>
        </div>
        <p className="text-sm text-white/50">
          Ask Nexa about your course performance, conversion rates, and revenue breakdowns.
          Nexa is scoped strictly to your creator data.
        </p>
        <div className="mt-4 flex gap-2">
          <input
            id="nexa-analytics-input"
            type="text"
            placeholder="Nexa, what's my best-selling course this week?"
            className="flex-1 bg-white/10 border border-white/20 text-white placeholder-white/40 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
          />
          <button onClick={() => { const v = document.getElementById('nexa-analytics-input')?.value; if (v?.trim()) sendAnalyticsAsk(v); }} className="bg-[#7C3AED] text-black px-4 py-2 rounded-xl text-sm font-semibold hover:brightness-110 active:scale-[0.98] transition-all duration-150">
            Ask
          </button>
        </div>
      </section>

      {/* User info */}
      <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between text-sm">
        <div>
          <p className="text-sm font-medium text-white">{user?.fullName}</p>
          <p className="text-xs text-white/40">{user?.email}</p>
          <span className="inline-block mt-1 px-2 py-0.5 bg-[#7C3AED] text-black text-xs font-medium rounded-full">
            {user?.role}
          </span>
        </div>
        <button onClick={() => { localStorage.removeItem('nexify_token'); navigate('/login'); }} className="text-sm text-white/40 hover:text-white transition-colors">
          Sign Out
        </button>
      </div>
    </div>
  );
}
