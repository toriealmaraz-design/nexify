/**
 * Creator Dashboard — Portal Shell
 * Course builder, workshop logistics, promo assets, revenue dashboard, Nexa analytics.
 *
 * Design: Grodital dark theme (deep black + gold accents)
 * Reference: PRD 6.3, SRS Persona B
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { SkeletonStats, SkeletonRow } from '../../components/Skeleton';
import axios from 'axios';

export default function CreatorDashboard() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useState(() => {
    axios.get('http://localhost:5000/api/v1/courses/stats/creator')
      .then(res => setCourses(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl">
      {/* Page header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Creator Studio</h1>
          <p className="text-white/40 text-sm mt-1">Build courses. Manage workshops. Grow your brand.</p>
        </div>
        <span className="text-xs bg-[#7C3AED]/20 text-[#7C3AED] font-medium px-2 py-1 rounded-full">
          {user?.role}
        </span>
      </div>

      {/* Stats row */}
      {loading ? (
        <SkeletonStats />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Revenue', value: 'GH₵ 0.00', icon: '💰', color: 'text-emerald-400' },
            { label: 'Courses Published', value: '0', icon: '📚', color: 'text-[#7C3AED]' },
            { label: 'Total Students', value: '0', icon: '👨‍🎓', color: 'text-blue-400' },
            { label: 'Pending Payouts', value: 'GH₵ 0.00', icon: '⏳', color: 'text-amber-400' },
          ].map(stat => (
            <div key={stat.label} className="bg-[#1E1B4B] border border-white/10 rounded-xl p-4 hover:border-white/20 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{stat.icon}</span>
                <span className="text-xs font-medium text-white/40 uppercase tracking-wider">{stat.label}</span>
              </div>
              <p className={`text-xl font-bold text-white ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Course Builder CTA */}
      <div className="bg-[#1E1B4B] border border-white/10 text-white rounded-2xl p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold mb-1">Create Your First Course</h2>
            <p className="text-sm text-white/50">Build a course with modules, lessons, and a 30-90 second trailer.</p>
          </div>
          <button className="bg-[#7C3AED] text-black px-5 py-2.5 rounded-xl font-semibold hover:brightness-110 active:scale-[0.98] transition-all duration-150 flex items-center gap-2">
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
          <button className="text-sm text-[#7C3AED] font-medium hover:underline">+ Add New</button>
        </div>
        {loading ? (
          <SkeletonRow count={3} />
        ) : courses.length === 0 ? (
          <div className="bg-[#1E1B4B] border border-white/10 rounded-xl p-8 text-center">
            <div className="text-4xl mb-3">📚</div>
            <h3 className="text-base font-semibold text-white mb-1">No courses yet</h3>
            <p className="text-sm text-white/40 mb-4">Create your first course to start earning.</p>
            <button className="bg-[#7C3AED] text-black px-4 py-2 rounded-xl text-sm font-semibold hover:brightness-110 active:scale-[0.98] transition-all duration-150">
              Create Course
            </button>
          </div>
        ) : (
          <div className="space-y-3">
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
                    <span className="text-xs text-white/30 capitalize">
                      {course.type === 'IN_PERSON_LAB' ? '🏫 Lab' : '💻 Digital'}
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
                  <button className="text-sm border border-white/10 text-white/60 px-3 py-1.5 rounded-xl hover:bg-white/5 transition-colors">
                    Edit
                  </button>
                  <button className="text-sm border border-white/10 text-white/60 px-3 py-1.5 rounded-xl hover:bg-white/5 transition-colors">
                    Stats
                  </button>
                  <button className="text-sm bg-[#7C3AED] text-black px-3 py-1.5 rounded-xl hover:brightness-110 active:scale-[0.98] transition-all duration-150 font-medium">
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
      <section className="bg-[#1E1B4B] border border-white/10 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-bold text-white mb-2">Promo Asset Manager</h2>
        <p className="text-sm text-white/40 mb-4">Upload WhatsApp scripts, TikTok hooks, and email templates.</p>
        <div className="flex gap-2">
          <button className="bg-[#7C3AED] text-black px-4 py-2 rounded-xl text-sm font-semibold hover:brightness-110 active:scale-[0.98] transition-all duration-150">
            + Upload Swipe Asset
          </button>
          <button className="border border-white/10 text-white/60 px-4 py-2 rounded-xl text-sm hover:bg-white/5 transition-colors">
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
            type="text"
            placeholder="Nexa, what's my best-selling course this week?"
            className="flex-1 bg-white/10 border border-white/20 text-white placeholder-white/40 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
          />
          <button className="bg-[#7C3AED] text-black px-4 py-2 rounded-xl text-sm font-semibold hover:brightness-110 active:scale-[0.98] transition-all duration-150">
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
        <button className="text-sm text-white/40 hover:text-white transition-colors">
          Sign Out
        </button>
      </div>
    </div>
  );
}
