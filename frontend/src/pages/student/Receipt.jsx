/**
 * Receipt Page — Printable-style order receipt for students.
 * Route: /student/receipts/:orderId
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
  Hash,
  Calendar,
  CreditCard,
  BookOpen,
  Package,
  Printer,
} from 'lucide-react';
import axios from 'axios';

const API = '/api/v1';

function SkeletonReceipt() {
  return (
    <div className="bg-[#1E1B4B] border border-white/10 rounded-2xl p-8 animate-pulse">
      <div className="border-b border-white/10 pb-6 mb-6">
        <div className="h-6 w-48 bg-white/10 rounded mb-2" />
        <div className="h-4 w-32 bg-white/10 rounded" />
      </div>
      <div className="space-y-3 mb-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-4 bg-white/10 rounded" style={{ width: `${60 + i * 10}%` }} />
        ))}
      </div>
      <div className="space-y-2 pt-6 border-t border-white/10">
        <div className="h-4 w-40 bg-white/10 rounded" />
        <div className="h-4 w-56 bg-white/10 rounded" />
      </div>
    </div>
  );
}

function StatusIcon({ status }) {
  const s = status?.toUpperCase();
  if (s === 'COMPLETED' || s === 'SUCCESSFUL') return <CheckCircle className="w-4 h-4 text-emerald-400" />;
  if (s === 'PENDING') return <Clock className="w-4 h-4 text-amber-400" />;
  if (s === 'REFUNDED') return <Clock className="w-4 h-4 text-slate-400" />;
  if (s === 'FAILED') return <XCircle className="w-4 h-4 text-red-400" />;
  return <Clock className="w-4 h-4 text-white/40" />;
}

function StatusBadge({ status }) {
  const s = status?.toUpperCase();
  let cls = 'bg-white/10 text-white/60';
  if (s === 'COMPLETED' || s === 'SUCCESSFUL') cls = 'bg-emerald-500/20 text-emerald-400';
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

export default function Receipt() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('nexify_token');
    if (!token) {
      setLoading(false);
      return;
    }

    axios
      .get(`${API}/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(res => {
        setOrder(res.data?.data || res.data);
      })
      .catch(err => {
        if (err.response?.status === 401) {
          localStorage.removeItem('nexify_token');
          window.location.href = '/login';
        } else {
          setError('Receipt not found. The order may have been removed.');
        }
      })
      .finally(() => setLoading(false));
  }, [orderId]);

  const handlePrint = () => window.print();

  if (loading) {
    return (
      <div className="max-w-lg mx-auto">
        <SkeletonReceipt />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <div className="w-16 h-16 bg-[#1E1B4B] border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <XCircle className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-lg font-bold text-white mb-2">Receipt unavailable</h2>
        <p className="text-sm text-white/40 mb-6">{error || 'Order not found.'}</p>
        <Link
          to="/student/orders"
          className="inline-flex items-center gap-2 bg-[#7C3AED] text-black px-5 py-2.5 rounded-xl text-sm font-semibold hover:brightness-110 active:scale-[0.98] transition-all duration-150"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Orders
        </Link>
      </div>
    );
  }

  const dateStr = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString('en-GB', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

  const items = order.items || [];
  const subtotal = items.reduce((s, i) => s + (i.priceGhs || 0), 0);
  const total = order.totalAmountGhs ?? subtotal;

  return (
    <div className="max-w-lg mx-auto">
      {/* Page controls */}
      <div className="flex items-center justify-between mb-6">
        <Link
          to="/student/orders"
          className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Orders
        </Link>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-[#1E1B4B] border border-white/10 text-white/70 px-3 py-2 rounded-xl text-xs font-medium hover:bg-white/5 hover:text-white transition-all"
        >
          <Printer className="w-3.5 h-3.5" />
          Print
        </button>
      </div>

      {/* Receipt card */}
      <div className="bg-[#1E1B4B] border border-white/10 rounded-2xl overflow-hidden print:shadow-none print:border-0">
        {/* Nexify branding header */}
        <div className="bg-[#0F172A] px-8 py-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#7C3AED] rounded-xl flex items-center justify-center">
                <span className="text-black font-bold text-base">N</span>
              </div>
              <div>
                <p className="text-white font-bold text-sm">Nexify</p>
                <p className="text-white/40 text-xs">Purchase Receipt</p>
              </div>
            </div>
            <StatusBadge status={order.paymentStatus || order.status} />
          </div>
        </div>

        {/* Order meta */}
        <div className="px-8 py-6 border-b border-white/10 space-y-3">
          <div className="flex items-center gap-3">
            <Hash className="w-4 h-4 text-white/30 flex-shrink-0" />
            <div>
              <p className="text-xs text-white/40">Order ID</p>
              <p className="text-sm font-mono text-white/70">{order.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-white/30 flex-shrink-0" />
            <div>
              <p className="text-xs text-white/40">Date</p>
              <p className="text-sm text-white/70">{dateStr}</p>
            </div>
          </div>
          {order.paymentChannel && (
            <div className="flex items-center gap-3">
              <CreditCard className="w-4 h-4 text-white/30 flex-shrink-0" />
              <div>
                <p className="text-xs text-white/40">Payment Method</p>
                <p className="text-sm text-white/70 capitalize">{order.paymentChannel.replace('_', ' ')}</p>
              </div>
            </div>
          )}
          {order.transactionRef && (
            <div className="flex items-center gap-3">
              <Package className="w-4 h-4 text-white/30 flex-shrink-0" />
              <div>
                <p className="text-xs text-white/40">Transaction Ref</p>
                <p className="text-sm font-mono text-white/70">{order.transactionRef}</p>
              </div>
            </div>
          )}
        </div>

        {/* Items list */}
        <div className="px-8 py-6 border-b border-white/10">
          <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-4">Items</p>
          {items.length > 0 ? (
            <div className="space-y-3">
              {items.map((item, i) => (
                <div key={i} className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-2.5">
                    <BookOpen className="w-4 h-4 text-[#7C3AED] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-white">{item.courseName || item.course?.title || 'Course'}</p>
                      {item.type && (
                        <p className="text-xs text-white/30 capitalize mt-0.5">
                          {item.type.replace('_', ' ').toLowerCase()}
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="text-sm font-medium text-white flex-shrink-0">
                    GH&#x20B5; {(item.priceGhs || 0).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          ) : order.courseName ? (
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-2.5">
                <BookOpen className="w-4 h-4 text-[#7C3AED] mt-0.5 flex-shrink-0" />
                <p className="text-sm text-white">{order.courseName}</p>
              </div>
              <p className="text-sm font-medium text-white flex-shrink-0">
                GH&#x20B5; {(order.totalAmountGhs || 0).toFixed(2)}
              </p>
            </div>
          ) : (
            <p className="text-sm text-white/30 italic">No items</p>
          )}
        </div>

        {/* Payment summary */}
        <div className="px-8 py-6">
          <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3">Summary</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/50">Subtotal</span>
              <span className="text-white/70">GH&#x20B5; {subtotal.toFixed(2)}</span>
            </div>
            {order.discountGhs > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/50">Discount</span>
                <span className="text-emerald-400">-GH&#x20B5; {order.discountGhs.toFixed(2)}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <span className="text-sm font-semibold text-white">Total Paid</span>
              <span className="text-base font-bold text-white">GH&#x20B5; {total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <div className="px-8 py-4 border-t border-white/5 bg-[#0F172A]/50">
          <p className="text-xs text-white/30 text-center">
            Thank you for learning with Nexify. Contact support@nexify.com for billing inquiries.
          </p>
        </div>
      </div>

      {/* Back link below card */}
      <div className="mt-6 text-center">
        <Link
          to="/student/orders"
          className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Orders
        </Link>
      </div>
    </div>
  );
}
