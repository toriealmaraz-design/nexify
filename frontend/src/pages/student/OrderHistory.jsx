/**
 * Student Order History — Purchase History & Receipts
 * Dark theme, card-based list, filterable by status.
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  XCircle,
  Clock,
  BookOpen,
  ArrowRight,
  Package,
  Hash,
  Calendar,
  CreditCard,
} from 'lucide-react';
import axios from 'axios';

const API = '/api/v1';

function SkeletonCard() {
  return (
    <div className="bg-[#1E1B4B] border border-white/10 rounded-xl p-5 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-2">
          <div className="h-3 w-24 bg-white/10 rounded" />
          <div className="h-3 w-32 bg-white/10 rounded" />
        </div>
        <div className="h-6 w-20 bg-white/10 rounded-full" />
      </div>
      <div className="space-y-1.5 mb-4">
        <div className="h-3 w-48 bg-white/10 rounded" />
        <div className="h-3 w-36 bg-white/10 rounded" />
      </div>
      <div className="flex items-center justify-between pt-4 border-t border-white/5">
        <div className="h-4 w-20 bg-white/10 rounded" />
        <div className="h-8 w-28 bg-white/10 rounded-xl" />
      </div>
    </div>
  );
}

function StatusIcon({ status }) {
  const s = status?.toUpperCase();
  if (s === 'COMPLETED') return <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />;
  if (s === 'PENDING') return <Clock className="w-3.5 h-3.5 text-amber-400" />;
  if (s === 'REFUNDED') return <Clock className="w-3.5 h-3.5 text-slate-400" />;
  if (s === 'FAILED') return <XCircle className="w-3.5 h-3.5 text-red-400" />;
  return <Clock className="w-3.5 h-3.5 text-white/40" />;
}

function StatusBadge({ status }) {
  const s = status?.toUpperCase();
  let cls = 'bg-white/10 text-white/60';
  if (s === 'COMPLETED') cls = 'bg-emerald-500/20 text-emerald-400';
  else if (s === 'PENDING') cls = 'bg-amber-500/20 text-amber-400';
  else if (s === 'FAILED') cls = 'bg-red-500/20 text-red-400';
  else if (s === 'REFUNDED') cls = 'bg-slate-500/20 text-slate-400';

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cls}`}>
      <StatusIcon status={status} />
      {status?.toUpperCase()}
    </span>
  );
}

function OrderCard({ order }) {
  const navigate = useNavigate();
  const dateStr = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—';

  const courses = order.items?.length ? order.items.map(i => i.courseName || i.course?.title).filter(Boolean) : [];

  return (
    <div className="bg-[#1E1B4B] border border-white/10 rounded-xl p-5 hover:border-white/20 transition-colors">
      {/* Header row */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2 text-white/50">
          <Hash className="w-3.5 h-3.5" />
          <span className="font-mono text-xs text-white/70">{order.id?.slice(0, 18)}…</span>
        </div>
        <StatusBadge status={order.paymentStatus || order.status} />
      </div>

      {/* Date */}
      <div className="flex items-center gap-1.5 text-xs text-white/40 mb-3">
        <Calendar className="w-3.5 h-3.5" />
        <span>{dateStr}</span>
      </div>

      {/* Course list */}
      <div className="space-y-1 mb-4">
        {courses.length > 0 ? (
          courses.map((name, i) => (
            <div key={i} className="flex items-start gap-2">
              <BookOpen className="w-3.5 h-3.5 text-[#7C3AED] mt-0.5 flex-shrink-0" />
              <span className="text-sm text-white/80 leading-snug">{name}</span>
            </div>
          ))
        ) : order.courseName ? (
          <div className="flex items-start gap-2">
            <BookOpen className="w-3.5 h-3.5 text-[#7C3AED] mt-0.5 flex-shrink-0" />
            <span className="text-sm text-white/80 leading-snug">{order.courseName}</span>
          </div>
        ) : (
          <span className="text-sm text-white/30 italic">No course name</span>
        )}
      </div>

      {/* Footer row */}
      <div className="flex items-center justify-between pt-4 border-t border-white/5">
        <div className="flex items-center gap-1.5">
          <CreditCard className="w-3.5 h-3.5 text-white/30" />
          <span className="text-sm font-bold text-white">
            GH&#x20B5; {(order.totalAmountGhs || 0).toFixed(2)}
          </span>
        </div>
        <button
          onClick={() => navigate(`/student/receipts/${order.id}`)}
          className="flex items-center gap-1.5 bg-[#7C3AED] text-black px-3 py-1.5 rounded-xl text-xs font-semibold hover:brightness-110 active:scale-[0.98] transition-all duration-150"
        >
          View Receipt
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 bg-[#1E1B4B] border border-white/10 rounded-2xl flex items-center justify-center mb-4">
        <BookOpen className="w-8 h-8 text-white/30" />
      </div>
      <h3 className="text-base font-semibold text-white mb-1">No orders yet</h3>
      <p className="text-sm text-white/40 mb-6 max-w-xs">
        Your purchase history will appear here once you enroll in a course.
      </p>
      <Link
        to="/"
        className="flex items-center gap-2 bg-[#7C3AED] text-black px-5 py-2.5 rounded-xl text-sm font-semibold hover:brightness-110 active:scale-[0.98] transition-all duration-150"
      >
        Browse Courses
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

const TABS = ['All', 'Completed', 'Pending', 'Refunded'];

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('All');

  useEffect(() => {
    const token = localStorage.getItem('nexify_token');
    if (!token) {
      setLoading(false);
      return;
    }

    axios
      .get('/api/v1/orders/my-orders', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(res => {
        setOrders(res.data?.data || res.data || []);
      })
      .catch(err => {
        if (err.response?.status === 401) {
          localStorage.removeItem('nexify_token');
          window.location.href = '/login';
        } else {
          setError('Failed to load orders. Please try again.');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = orders.filter(o => {
    const s = (o.paymentStatus || o.status || '').toUpperCase();
    if (activeTab === 'All') return true;
    if (activeTab === 'Completed') return s === 'COMPLETED' || s === 'SUCCESSFUL';
    if (activeTab === 'Pending') return s === 'PENDING';
    if (activeTab === 'Refunded') return s === 'REFUNDED';
    return true;
  });

  return (
    <div className="max-w-2xl mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <Package className="w-5 h-5 text-[#7C3AED]" />
          <h1 className="text-xl font-bold text-white">Order History</h1>
        </div>
        <p className="text-sm text-white/40">Track your purchases and download receipts.</p>
      </div>

      {/* Status filter tabs */}
      {!loading && orders.length > 0 && (
        <div className="flex items-center gap-1 mb-6 bg-[#1E1B4B] border border-white/10 rounded-xl p-1">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150
                ${activeTab === tab
                  ? 'bg-[#7C3AED] text-black'
                  : 'text-white/50 hover:text-white hover:bg-white/5'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && orders.length === 0 && <EmptyState />}

      {/* Order list */}
      {!loading && !error && filtered.length > 0 && (
        <div className="space-y-4">
          {filtered.map(order => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}

      {/* No results for filter */}
      {!loading && !error && orders.length > 0 && filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-sm text-white/40">No {activeTab.toLowerCase()} orders found.</p>
        </div>
      )}
    </div>
  );
}
