/**
 * Student Dashboard — Portal Shell
 * Course marketplace browsing, single-step checkout, learning portal, progress tracker, reviews.
 *
 * Design: Grodital dark theme (deep black + gold accents)
 * Reference: PRD 6.5, SRS Persona D
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { SkeletonStats, SkeletonGrid, SkeletonRow } from '../../components/Skeleton';
import axios from 'axios';

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const { checkoutCourse, openCheckout, closeCheckout, includeOrderBump, toggleOrderBump, calculateTotal } = useCart();

  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useState(() => {
    axios.get('http://localhost:5000/api/v1/courses')
      .then(res => setCourses(res.data.data))
      .catch(() => {});
    axios.get('http://localhost:5000/api/v1/orders/my-orders')
      .then(res => setOrders(res.data.data))
      .catch(() => {});
    axios.get('http://localhost:5000/api/v1/enrollments')
      .catch(() => {});
    setLoading(false);
  }, []);

  const enrolledCourses = orders
    .filter(o => o.paymentStatus === 'SUCCESSFUL')
    .map(o => ({ ...o.course, order: o }));

  return (
    <div className="max-w-6xl">
      {/* Page header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Student Dashboard</h1>
          <p className="text-white/40 text-sm mt-1">Your courses, progress, and learning tools.</p>
        </div>
        <span className="text-xs bg-[#7C3AED]/20 text-[#7C3AED] font-medium px-2 py-1 rounded-full">
          {user?.role}
        </span>
      </div>

      {/* Stats */}
      {loading ? (
        <SkeletonStats />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Enrolled Courses', value: enrolledCourses.length?.toString() || '0', icon: '📚', color: 'text-[#7C3AED]' },
            { label: 'Total Spent', value: `GH₵ ${(orders.reduce((s, o) => s + o.totalAmountGhs, 0)).toFixed(2)}`, icon: '💰', color: 'text-emerald-400' },
            { label: 'Avg. Progress', value: '0%', icon: '📈', color: 'text-blue-400' },
            { label: 'Current Streak', value: '0 days', icon: '🔥', color: 'text-amber-400' },
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

      {/* Course Marketplace Browse */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Browse Marketplace</h2>
          <a href="/marketplace" className="text-sm text-[#7C3AED] font-medium hover:underline">View All →</a>
        </div>
        {loading ? (
          <SkeletonGrid cols={2} count={2} />
        ) : courses.length === 0 ? (
          <div className="bg-[#1E1B4B] border border-white/10 rounded-xl p-8 text-center">
            <div className="text-4xl mb-3">📚</div>
            <h3 className="text-base font-semibold text-white mb-1">No courses available</h3>
            <p className="text-sm text-white/40">Check back later for new course listings.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.slice(0, 4).map(course => (
              <div key={course.id} className="bg-[#1E1B4B] border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-colors">
                {/* Thumbnail */}
                <div className="aspect-video bg-[#0F172A] relative">
                  {course.coverImageUrl ? (
                    <img src={course.coverImageUrl} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-3xl text-white/30">{course.title.charAt(0)}</span>
                    </div>
                  )}
                  <span className="absolute top-2 left-2 bg-white/10 text-white/80 text-xs font-medium px-2 py-0.5 rounded-full capitalize">
                    {course.type === 'IN_PERSON_LAB' ? '🏫 Lab' : '💻 Digital'}
                  </span>
                </div>
                {/* Content */}
                <div className="p-4">
                  <h3 className="text-base font-bold text-white mb-1 line-clamp-2">{course.title}</h3>
                  <p className="text-xs text-white/30 mb-2 line-clamp-2">{course.description}</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-white/30">by {course.creator?.fullName}</span>
                      <div className="text-[#7C3AED] font-bold text-lg mt-0.5">
                        GH₵ {(course.priceGhs || 0).toFixed(2)}
                      </div>
                    </div>
                    <button
                      onClick={() => openCheckout(course)}
                      className="bg-[#7C3AED] text-black px-4 py-2 rounded-xl text-sm font-semibold hover:brightness-110 active:scale-[0.98] transition-all duration-150"
                    >
                      Buy Now
                    </button>
                  </div>
                  {/* Seat indicator */}
                  {course.type === 'IN_PERSON_LAB' && course.maxSeats && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <div className="flex items-center justify-between text-xs text-white/30 mb-1">
                        <span>Seats: {course.bookedSeats || 0} / {course.maxSeats}</span>
                        <span>{course.maxSeats - (course.bookedSeats || 0)} remaining</span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all
                            ${((course.bookedSeats || 0) / course.maxSeats) < 0.7 ? 'bg-emerald-500'
                              : ((course.bookedSeats || 0) / course.maxSeats) < 0.9 ? 'bg-amber-500'
                              : 'bg-red-500 animate-pulse'}`}
                          style={{ width: `${((course.bookedSeats || 0) / course.maxSeats) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {/* Trailer badge */}
                  {course.teaserUrl && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-white/30">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span>30-90s trailer available</span>
                    </div>
                  )}
                  {/* Order bump indicator */}
                  {course.hasOrderBump && course.orderBumpTitle && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 p-2 rounded-xl border border-amber-500/20">
                      <span className="text-base leading-none">+</span>
                      <span className="flex-1">{course.orderBumpTitle}</span>
                      <span className="font-medium">GH₵ {course.orderBumpPriceGhs?.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Enrolled Courses / Learning Portal */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">My Courses</h2>
          <a href="/student/enrolled" className="text-sm text-[#7C3AED] font-medium hover:underline">Manage →</a>
        </div>
        {enrolledCourses.length === 0 ? (
          <div className="bg-[#1E1B4B] border border-white/10 rounded-xl p-8 text-center">
            <div className="text-4xl mb-3">🎓</div>
            <h3 className="text-base font-semibold text-white mb-1">No courses enrolled yet</h3>
            <p className="text-sm text-white/40 mb-4">Browse the marketplace and enroll in a course.</p>
            <a href="/marketplace" className="inline-block bg-[#7C3AED] text-black px-4 py-2 rounded-xl text-sm font-semibold hover:brightness-110 active:scale-[0.98] transition-all duration-150">
              Browse Courses
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            {enrolledCourses.map(course => (
              <div key={course.id} className="bg-[#1E1B4B] border border-white/10 rounded-xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:border-white/20 transition-colors">
                <div>
                  <h3 className="text-base font-bold text-white">{course.title}</h3>
                  <p className="text-sm text-white/40 mt-1">
                    GH₵ {((course.priceGhs || 0) + (course.hasOrderBump ? course.orderBumpPriceGhs || 0 : 0)).toFixed(2)} · Paid
                  </p>
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-white/30 mb-1">
                      <span>Progress</span>
                      <span>0%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '0%' }} />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="bg-[#0F172A] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#0F172A] transition-colors">
                    Continue Learning
                  </button>
                  <button className="border border-white/10 text-white/60 px-3 py-2 rounded-xl text-sm hover:bg-white/5 transition-colors">
                    Review
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Receipts / Order History */}
      <section className="bg-[#1E1B4B] border border-white/10 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Order Receipts</h2>
          <a href="/student/receipts" className="text-sm text-[#7C3AED] font-medium hover:underline">View All →</a>
        </div>
        {orders.length === 0 ? (
          <div className="text-center py-4 text-white/30 text-sm">No orders yet.</div>
        ) : (
          <div className="space-y-2">
            {orders.slice(0, 5).map(order => (
              <div key={order.id} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                <div>
                  <p className="text-sm font-medium text-white">{order.course?.title}</p>
                  <p className="text-xs text-white/30 mt-0.5">
                    {order.paymentChannel.replace('_', ' ')} · {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-white">GH₵ {order.totalAmountGhs.toFixed(2)}</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full
                    ${order.paymentStatus === 'SUCCESSFUL' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : order.paymentStatus === 'PENDING' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                      : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                    {order.paymentStatus.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Nexa Assistant */}
      <section className="bg-[#1E1B4B] border border-white/10 text-white rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#7C3AED] rounded-full flex items-center justify-center text-black text-sm font-bold">N</div>
            <h2 className="text-lg font-bold">Nexa Learning Assistant</h2>
          </div>
          <span className="text-xs bg-white/10 text-white/70 px-2 py-1 rounded-full">STUDENT SCOPE</span>
        </div>
        <p className="text-sm text-white/50">
          Ask Nexa about your course progress, order receipts, workshop logistics, and platform FAQs.
          Nexa is scoped strictly to your student data and public information.
        </p>
        <div className="mt-4 flex gap-2">
          <input
            type="text"
            placeholder="Nexa, how do I access my enrolled course?"
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
